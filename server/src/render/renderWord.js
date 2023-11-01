const {escapeMarkdown} = require('telegram-escape');
const {Progress} = require('../repo/words');

const mapWordProgressToStatus = {
  [Progress.Learned]: '*Learned 🟢*',
  [Progress.ActiveLearning]: '*ActiveLearning 🔵*',
  [Progress.NeedToRepeat]: '*Need to repeat 🟡*',
  [Progress.HaveToPayAttention]: '*Have to pay attention 🟠*',
  [Progress.HaveProblems]: '*Have problems 🔴*',
};

// eslint-disable-next-line
/**
   * @param {import('../repo/words').Word} word
   * @param {string} status
   * @return {string}
   */
const renderWordWithCustomStatus = (word, status) => {
  const english = escapeMarkdown(word.English);
  const translation = escapeMarkdown(word.Translation);
  const examples = escapeMarkdown(word.Examples);

  return `
*English:*
${english} \\- ${status} 

*Examples:*
${examples}

*Translation:*
||${translation}||
          `;
};


module.exports = {
  renderWordWithCustomStatus,
  mapWordProgressToStatus,
};
