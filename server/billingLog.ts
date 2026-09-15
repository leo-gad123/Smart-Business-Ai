import { config } from 'dotenv';

config();

/**
 * Log every subscription / payment event to the server console with a
 * consistent prefix. In production this can be swapped for a structured
 * logger or a DB audit collection.
 */
export function logSubscriptionEvent(subscriptionId: string, event: string, message: string): void {
  console.log(
    `[SmartStock Subscriptions][${new Date().toISOString()}] ${event} (sub: ${subscriptionId.slice(0, 12)}…) ${message}`,
  );
}

export function logPaymentEvent(subscriptionId: string, event: string, message: string): void {
  console.log(
    `[SmartStock Payments][${new Date().toISOString()}] ${event} (sub: ${subscriptionId.slice(0, 12)}…) ${message}`,
  );
}