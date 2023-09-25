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

module.exports = {
  renderRichText,
};
