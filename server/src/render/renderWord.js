const {escapeMarkdown} = require('telegram-escape');
const {Progress} = require('../repo/words');

const mapWordProgressToStatus = {
  [Progress.Learned]: '*Learned 🟢*',
  [Progress.ActiveLearning]: '*Active Learning 🔵*',
  [Progress.NeedToRepeat]: '*Need to repeat 🟡*',
  [Progress.HaveToPayAttention]: '*Have to pay attention 🟠*',
  [Progress.HaveProblems]: '*Have problems 🔴*',
};

// eslint-disable-next-line
/**
   * @param {Pick<import('../repo/words').Word, 'English' | 'Translation' | 'Examples'>} word
   * @param {string} [status]
   * @return {string}
   */
const renderWordWithCustomStatus = (word, status) => {
  const english = escapeMarkdown(word.English);
  const translation = escapeMarkdown(word.Translation);
  const examples = word.Examples ? escapeMarkdown(word.Examples) : null;

  return `
*English:*
${english} ${status ? `\\- ${status}` : ''}
${examples ? `
*Examples:*
${examples}
`: ''}
*Translation:*
||${translation}||
          `;
};


module.exports = {
  renderWordWithCustomStatus,
  mapWordProgressToStatus,
};
