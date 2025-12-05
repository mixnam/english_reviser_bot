import {escapeMarkdown} from 'telegram-escape';

import {Progress, Word} from '../repo/words.js';

interface LanguageTranslations {
  learned: string;
  activeLearning: string;
  needToRepeat: string;
  haveToPayAttention: string;
  haveProblems: string;
  wordLabel: string;
  examplesLabel: string;
  translationLabel: string;
}

const languageTokenMap: {[key: string]: LanguageTranslations} = {
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

const renderWordWithCustomStatus = (word: Word, status?: string): string => {
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

