/**
 * Yield execution back to the browser main thread to prevent long tasks (> 50ms)
 * and guarantee optimal Interaction to Next Paint (INP <= 200ms).
 * Follows Modern Web Guidance: break-up-long-tasks.
 */
export async function yieldToMain() {
  if (
    typeof scheduler !== "undefined" &&
    typeof scheduler.yield === "function"
  ) {
    await scheduler.yield();
    return;
  }
  await new Promise((resolve) => setTimeout(resolve, 0));
}
