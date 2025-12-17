import {escapeMarkdown} from 'telegram-escape';

import {Progress, Word, ProgressOrder} from '../repo/words.js';

type LanguageTranslations = {
  learned: string;
  activeLearning: string;
  needToRepeat: string;
  haveToPayAttention: string;
  haveProblems: string;
  wordLabel: string;
  examplesLabel: string;
  translationLabel: string;
  totalWordsLabel: string;
  totalProgressLabel: string;
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
    totalWordsLabel: 'Total words',
    totalProgressLabel: 'Total progress',
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
    totalWordsLabel: 'Total palavras',
    totalProgressLabel: 'Progresso total',
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

const mapWordProgressToStatus: Record<string, string> = {
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

const renderWordsStats = (stats: Record<string, number>): string => {
  let totalWords = 0;
  Object.values(stats).forEach((count) => {
    totalWords += count;
  });

  let message = `${languageTokenMap[languageToken].totalWordsLabel}: ${totalWords}\n\n`;


  const wordWeight = ProgressOrder.length - 1;
  const targetWeight = totalWords * wordWeight;
  let currentWeight = 0;

  const progressWeightMap = ProgressOrder.reduce(({result, weight}, progress) => {
    return {
      result: {
        ...result,
        [progress]: weight - 1,
      },
      weight: weight - 1,
    };
  }, {
    result: {},
    weight: ProgressOrder.length - 1,
  }).result;

  [...ProgressOrder].reverse().forEach((progress) => {
    const count = stats[progress] || 0;
    currentWeight += count * progressWeightMap[progress];
    if (count > 0) {
      const percentage = ((count / totalWords) * 100).toFixed(1);
      const statusLabel = mapWordProgressToStatus[progress] || progress;
      message += `${statusLabel}: ${escapeMarkdown(`${count} (${percentage}%)`)}\n`;
    }
  });

  const progressPersentage = Math.round((currentWeight / targetWeight) * 100);
  const done = Math.floor(progressPersentage / 10);
  const left = 10 - done;
  const progressBar = [
    ...Array.from({length: done}, () => '🟦'),
    ...Array.from({length: left}, () => '⬜️'),
  ].join('');


  message +=`\n\n${languageTokenMap[languageToken].totalProgressLabel}: ${progressBar} ${escapeMarkdown(`(${progressPersentage}%)`)}`;

  return message;
};


export {
  renderWordWithCustomStatus,
  mapWordProgressToStatus,
  renderWordsStats,
};

