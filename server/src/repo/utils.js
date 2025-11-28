/**
 * @typedef LogFn
 * @type {{
 *  (ctx: Object, msg: string) : void;
 *  (ctx: Object, error: Error) : void;
 *  (msg: string) : void
 *  (error: Error) : void
 * }}
 */

/**
 * @typedef Logger
 * @type {Object}
 * @property {LogFn} info
 */

/**
 * @typedef Wrapper
 * @type {{
 *  <T extends (...args: [...any, Logger]) => any>(name: string, callback: T) : T;
 * }}
 */

/**
 * @type {Wrapper}
 */
// @ts-ignore
const executionTime = (name, fn) => async (...args) => {
  const start = Date.now();
  const logger = /** @type {Logger} */ (args[args.length-1]);
  const result = await fn(...args);
  logger.info(`[EXECUTION_TIME]: ${name} - ${Date.now() - start}`);
  return result;
};

/**
 * @param {number} days
 * @returns {Date}
 */
const minusDaysFromNow = (days) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  now.setDate(now.getDate() - days);
  return now;
};

export {
  executionTime,
  minusDaysFromNow,
};
