/**
 * Sleep utility function that returns a promise that resolves after the specified time.
 * @param ms - The number of milliseconds to sleep
 * @returns A promise that resolves after the specified time
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sleep utility with a more descriptive name for better readability.
 * @param milliseconds - The number of milliseconds to sleep
 * @returns A promise that resolves after the specified time
 */
export function delay(milliseconds: number): Promise<void> {
  return sleep(milliseconds);
}

/**
 * Sleep utility that accepts seconds instead of milliseconds.
 * @param seconds - The number of seconds to sleep
 * @returns A promise that resolves after the specified time
 */
export function sleepSeconds(seconds: number): Promise<void> {
  return sleep(seconds * 1000);
}

/**
 * Sleep utility that accepts minutes instead of milliseconds.
 * @param minutes - The number of minutes to sleep
 * @returns A promise that resolves after the specified time
 */
export function sleepMinutes(minutes: number): Promise<void> {
  return sleep(minutes * 60 * 1000);
}
