import type { Request, Response } from 'express';
import app from './index';
import { connectMongo, ensureSubscriptionIndexes } from './mongo';

let dbReady: Promise<boolean> | null = null;

function ensureDb(): Promise<boolean> {
  if (!dbReady) {
    dbReady = connectMongo()
      .then(() => ensureSubscriptionIndexes().catch(() => undefined))
      .then(() => true)
      .catch((err) => {
        console.error('[SmartStock API] Mongo connect failed:', err);
        return false;
      });
  }
  return dbReady;
}

// Vercel serverless entry point (precompiled to api/index.js by `npm run build:api`).
// Mongo is lazily connected once per Lambda; mongoose reuses the cached connection
// on warm invocations.
export default async function handler(req: Request, res: Response): Promise<void> {
  await ensureDb();
  return app(req, res);
}