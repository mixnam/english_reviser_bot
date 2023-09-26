/**
 * @global
 * @typedef RichText
 * @type {object}
 * @property {string} type
 * @property {Text[]} rich_text
 */

/**
 * @typedef Text
 * @type {object}
 * @property {string} plain_text
 */

/**
 * @param {RichText} richText
 * @return {string}
 */
const renderRichText = (richText) => {
  return richText.rich_text.map((text) => text.plain_text).join('');
};

/**
 * @param {string} name
 * @param {Function} fn
 * @return {Function}
 */
const executionTime = (name, fn) => async (...args) => {
  const start = Date.now();
  const result = await fn(...args);
  console.log(`[EXECUTION_TIME]: ${name} - ${Date.now() - start}`);
  return result;
};

module.exports = {
  renderRichText,
  executionTime,
};
