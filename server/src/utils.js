/**
 * @template {Function} T
 * @param {string} name
 * @param {T} fn
 * @return {T}
 */
// @ts-ignore
const executionTime = (name, fn) => async (...args) => {
  const start = Date.now();
  const result = await fn(...args);
  console.log(`[EXECUTION_TIME]: ${name} - ${Date.now() - start}`);
  return result;
};

module.exports = {
  executionTime,
};
