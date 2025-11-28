import {escapeMarkdown} from 'telegram-escape';

import {Progress} from '../repo/words.js';

/**
 * @typedef {Object} LanguageTranslations
 * @property {string} learned - Translation for 'Learned'.
 * @property {string} activeLearning - Translation for 'Active Learning'.
 * @property {string} needToRepeat - Translation for 'Need to repeat'.
 * @property {string} haveToPayAttention - Translation for 'Have to pay attention'.
 * @property {string} haveProblems - Translation for 'Have problems'.
 * @property {string} wordLabel - Translation for the label 'Word'.
 * @property {string} examplesLabel - Translation for the label 'Examples'.
 * @property {string} translationLabel - Translation for the label 'Translation'.
 */

/**
 * @type {Object.<string, LanguageTranslations>}
 */
const languageTokenMap = {
  en: {
    learned: '*Learned *🟢',
    activeLearning: '*Active Learning 🔵*',
    needToRepeat: '*Need to repeat 🟡*',
    haveToPayAttention: '*Have to pay attention 🟠*',
    haveProblems: '*Have problems 🔴*',
    wordLabel: 'Word',
    examplesLabel: 'Examples',
    translationLabel: 'Translation',
  },
  pt: {
    learned: '*Aprendido 🟢*',
    activeLearning: '*Aprendizado Ativo 🔵*',
    needToRepeat: '*Necessita Repetição 🟡*',
    haveToPayAttention: '*Precisa Prestar Atenção 🟠*',
    haveProblems: '*Apresenta Problemas 🔴*',
    wordLabel: 'Palavra',
    examplesLabel: 'Exemplos',
    translationLabel: 'Tradução',
  },
};

const languageToken = process.env.LANGUAGE_CODE?.startsWith('pt') ? 'pt' : 'en';

const {
  learned,
  activeLearning,
  needToRepeat,
  haveToPayAttention,
  haveProblems,
} = languageTokenMap[languageToken];

const mapWordProgressToStatus = {
  [Progress.Learned]: learned,
  [Progress.ActiveLearning]: activeLearning,
  [Progress.NeedToRepeat]: needToRepeat,
  [Progress.HaveToPayAttention]: haveToPayAttention,
  [Progress.HaveProblems]: haveProblems,
};

// eslint-disable-next-line
/**
 * @param {import('../repo/words.js').Word} word
 * @param {string} [status]
 * @return {string}
 */
const renderWordWithCustomStatus = (word, status) => {
  const english = escapeMarkdown(word.English);
  const translation = escapeMarkdown(word.Translation);
  const examples = word.Examples ? escapeMarkdown(word.Examples) : null;

  return `
*${languageTokenMap[languageToken].wordLabel}:*
${english} ${status ? `\\- ${status}` : ''}
${examples ? `
*${languageTokenMap[languageToken].examplesLabel}:*
${examples}
`: ''}
*${languageTokenMap[languageToken].translationLabel}:*
||${translation}||
  `;
};

export {
  renderWordWithCustomStatus,
  mapWordProgressToStatus,
};
