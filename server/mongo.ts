import mongoose from 'mongoose';
import { config } from 'dotenv';
import { getModel } from './models';

config();

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/smartstock_rwanda';

const DB_NAME = process.env.MONGODB_DB_NAME || 'smartstock_rwanda';

export async function connectMongo(): Promise<mongoose.Connection> {
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return mongoose.connection;
  }
  await mongoose.connect(MONGODB_URI, {
    dbName: DB_NAME,
    serverSelectionTimeoutMS: 5000,
  });
  console.log(`[SmartStock Mongo] Connected to ${MONGODB_URI} (db: ${DB_NAME})`);
  mongoose.connection.on('error', (err) => {
    console.error('[SmartStock Mongo] Connection error:', err);
  });
  return mongoose.connection;
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
}

function toPlain(doc: Record<string, unknown>): Record<string, unknown> {
  return { ...doc };
}

export async function getItems(collectionName: string): Promise<Record<string, unknown>[]> {
  const model = getModel(collectionName);
  const docs = await model.find({}).lean().exec();
  return docs.map((d) => {
    const { _id, ...rest } = d as unknown as Record<string, unknown>;
    return toPlain(rest);
  });
}

export async function replaceItems(collectionName: string, items: unknown[]): Promise<void> {
  const model = getModel(collectionName);
  await model.deleteMany({}).exec();
  if (items && items.length > 0) {
    await model.insertMany(items as Record<string, unknown>[]);
  }
}

export async function clearCollection(collectionName: string): Promise<void> {
  const model = getModel(collectionName);
  await model.deleteMany({}).exec();
}

export async function getItem(collectionName: string, id: string): Promise<Record<string, unknown> | null> {
  const model = getModel(collectionName);
  const doc = await model.findOne({ id }).lean().exec();
  if (!doc) return null;
  const { _id, ...rest } = doc as unknown as Record<string, unknown>;
  return toPlain(rest);
}

export async function upsertItem(collectionName: string, item: Record<string, unknown>): Promise<void> {
  const model = getModel(collectionName);
  if (!item.id) {
    throw new Error('Document requires an "id" field');
  }
  await model.updateOne({ id: item.id }, { $set: item }, { upsert: true }).exec();
}

export async function deleteItem(collectionName: string, id: string): Promise<boolean> {
  const model = getModel(collectionName);
  const result = await model.deleteOne({ id }).exec();
  return result.deletedCount > 0;
}

export async function listCollections(): Promise<string[]> {
  const collections = await mongoose.connection.db.listCollections().toArray();
  return collections.map((c) => c.name);
}

/**
 * Create indexes for the subscription engine (idempotent).
 * - subscriptions.businessId unique → prevents duplicate subscriptions per shop
 * - subscriptions.ownerId → fast lookup by owner
 * - subscriptionpayments { subscriptionId, billingPeriod } → prevents duplicate monthly charges
 */
export async function ensureSubscriptionIndexes(): Promise<void> {
  const subModel = getModel('subscriptions');
  const payModel = getModel('subscriptionpayments');

  await Promise.all([
    subModel.collection.createIndex({ businessId: 1 }, { unique: true, background: true }),
    subModel.collection.createIndex({ ownerId: 1 }, { background: true }),
    subModel.collection.createIndex({ status: 1 }, { background: true }),
    subModel.collection.createIndex({ nextPaymentDate: 1 }, { background: true }),
    payModel.collection.createIndex(
      { subscriptionId: 1, billingPeriod: 1 },
      { unique: true, background: true },
    ),
    payModel.collection.createIndex({ status: 1 }, { background: true }),
  ]);
  console.log('[SmartStock Mongo] Subscription indexes ensured.');
}