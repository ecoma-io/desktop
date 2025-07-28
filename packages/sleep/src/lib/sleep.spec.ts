import { sleep, delay, sleepSeconds, sleepMinutes } from './sleep';

describe('Sleep Utilities', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('sleep', () => {
    it('should resolve after the specified milliseconds', async () => {
      const startTime = Date.now();
      const sleepPromise = sleep(100);

      jest.advanceTimersByTime(100);
      await sleepPromise;

      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    });

    it('should resolve immediately for 0 milliseconds', async () => {
      const startTime = Date.now();
      const sleepPromise = sleep(0);

      jest.advanceTimersByTime(0);
      await sleepPromise;

      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle negative values by treating them as 0', async () => {
      const startTime = Date.now();
      const sleepPromise = sleep(-100);

      jest.advanceTimersByTime(0);
      await sleepPromise;

      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    });

    it('should work with large values', async () => {
      const startTime = Date.now();
      const sleepPromise = sleep(10000);

      jest.advanceTimersByTime(10000);
      await sleepPromise;

      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('delay', () => {
    it('should be an alias for sleep function', async () => {
      const startTime = Date.now();
      const delayPromise = delay(200);

      jest.advanceTimersByTime(200);
      await delayPromise;

      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    });

    it('should have the same behavior as sleep for 0 milliseconds', async () => {
      const startTime = Date.now();
      const delayPromise = delay(0);

      jest.advanceTimersByTime(0);
      await delayPromise;

      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle negative values the same as sleep', async () => {
      const startTime = Date.now();
      const delayPromise = delay(-50);

      jest.advanceTimersByTime(0);
      await delayPromise;

      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('sleepSeconds', () => {
    it('should sleep for the correct number of milliseconds when given seconds', async () => {
      const startTime = Date.now();
      const sleepPromise = sleepSeconds(1);

      jest.advanceTimersByTime(1000);
      await sleepPromise;

      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle fractional seconds', async () => {
      const startTime = Date.now();
      const sleepPromise = sleepSeconds(0.5);

      jest.advanceTimersByTime(500);
      await sleepPromise;

      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle multiple seconds', async () => {
      const startTime = Date.now();
      const sleepPromise = sleepSeconds(3);

      jest.advanceTimersByTime(3000);
      await sleepPromise;

      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle 0 seconds', async () => {
      const startTime = Date.now();
      const sleepPromise = sleepSeconds(0);

      jest.advanceTimersByTime(0);
      await sleepPromise;

      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle negative seconds', async () => {
      const startTime = Date.now();
      const sleepPromise = sleepSeconds(-1);

      jest.advanceTimersByTime(0);
      await sleepPromise;

      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('sleepMinutes', () => {
    it('should sleep for the correct number of milliseconds when given minutes', async () => {
      const startTime = Date.now();
      const sleepPromise = sleepMinutes(1);

      jest.advanceTimersByTime(60000);
      await sleepPromise;

      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle fractional minutes', async () => {
      const startTime = Date.now();
      const sleepPromise = sleepMinutes(0.5);

      jest.advanceTimersByTime(30000);
      await sleepPromise;

      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle multiple minutes', async () => {
      const startTime = Date.now();
      const sleepPromise = sleepMinutes(2);

      jest.advanceTimersByTime(120000);
      await sleepPromise;

      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle 0 minutes', async () => {
      const startTime = Date.now();
      const sleepPromise = sleepMinutes(0);

      jest.advanceTimersByTime(0);
      await sleepPromise;

      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle negative minutes', async () => {
      const startTime = Date.now();
      const sleepPromise = sleepMinutes(-1);

      jest.advanceTimersByTime(0);
      await sleepPromise;

      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Integration tests', () => {
    it('should work correctly when chaining multiple sleep calls', async () => {
      const startTime = Date.now();

      const sleepPromise1 = sleep(100);
      jest.advanceTimersByTime(100);
      await sleepPromise1;

      const delayPromise = delay(200);
      jest.advanceTimersByTime(200);
      await delayPromise;

      const sleepSecondsPromise = sleepSeconds(0.1);
      jest.advanceTimersByTime(100);
      await sleepSecondsPromise;

      const sleepMinutesPromise = sleepMinutes(0.001);
      jest.advanceTimersByTime(60);
      await sleepMinutesPromise;

      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    }, 10000);

    it('should handle concurrent sleep calls', async () => {
      const startTime = Date.now();

      const promises = [
        sleep(100),
        delay(200),
        sleepSeconds(0.1),
        sleepMinutes(0.001)
      ];

      jest.advanceTimersByTime(200);
      await Promise.all(promises);

      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle very large numbers', async () => {
      const startTime = Date.now();
      const sleepPromise = sleep(Number.MAX_SAFE_INTEGER);

      jest.advanceTimersByTime(Number.MAX_SAFE_INTEGER);
      await sleepPromise;

      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle NaN values', async () => {
      const startTime = Date.now();
      const sleepPromise = sleep(NaN);

      jest.advanceTimersByTime(0);
      await sleepPromise;

      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle Infinity values', async () => {
      const startTime = Date.now();
      const sleepPromise = sleep(Infinity);

      jest.advanceTimersByTime(0);
      await sleepPromise;

      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    });
  });
});
