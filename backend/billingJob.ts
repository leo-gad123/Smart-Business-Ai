import { runBillingCycle } from './subscriptions';

let timer: NodeJS.Timeout | null = null;
let bootTimer: NodeJS.Timeout | null = null;

/**
 * Start the daily subscription billing scheduler.
 * Checks every 24h, plus an immediate run on boot when enabled.
 */
export function startBillingScheduler(): void {
  if (timer) return;

  const run = async () => {
    try {
      const result = await runBillingCycle();
      console.log(
        `[SmartStock Billing] Daily cycle running via ${timer ? 'interval' : 'boot'}: created=${result.created} due=${result.due} skipped=${result.skipped}`,
      );
    } catch (err) {
      console.error('[SmartStock Billing] Cycle failed:', (err as Error).message);
    }
  };

  // Run once shortly after boot (avoids racing DB connectivity), then daily.
  const bootTimer = setTimeout(() => { run(); }, 45_000);
  bootTimer.unref();

  timer = setInterval(run, 24 * 60 * 60 * 1000);
  timer.unref();

  console.log('[SmartStock Billing] Scheduler started (runs every 24h).');
}

/**
 * Stop the scheduler. Useful in tests.
 */
export function stopBillingScheduler(): void {
  if (bootTimer) clearTimeout(bootTimer);
  if (timer) clearInterval(timer);
  timer = null;
}