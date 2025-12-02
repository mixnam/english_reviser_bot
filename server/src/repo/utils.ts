import {Logger} from 'pino';

const executionTime = <T extends (...args: unknown[]) => unknown>(name: string, fn: T): T => {
  return (async (...args: unknown[]) => {
    const start = Date.now();
    const logger = args[args.length - 1] as Logger;
    const result = await fn(...args);
    logger.info(`[EXECUTION_TIME]: ${name} - ${Date.now() - start}`);
    return result;
  }) as T;
};

const minusDaysFromNow = (days: number): Date => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  now.setDate(now.getDate() - days);
  return now;
};

export {
  executionTime,
  minusDaysFromNow,
};
