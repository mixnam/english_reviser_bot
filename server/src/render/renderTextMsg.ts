import {escapeMarkdown} from 'telegram-escape';

import {renderWordWithCustomStatus, mapWordProgressToStatus} from './renderWord.js';
import {Word} from '../repo/words.js';

interface LanguageTranslations {
  renderNoMoreWordsToLearnForToday: () => string;
  renderYouHaveCovered_N_Words: (wordCount: number) => string;
  renderYouHaveGoneThrough_N_Words: (wordCount: number) => string;
  renderNoMoreWordsToReviseForToday: () => string;
  renderYouHaveRevised_N_Words: (wordCount: number) => string;
  renderNoIdea: () => string;
  renderSendMeContextForThisWord: () => string;
  renderSendMePictureForThisWord: () => string;
  renderSendMeWordToAdd: () => string;
  renderSendMeTranslationForThisWord: () => string;
  renderYouAreNotMyMaster: () => string;
  renderYouHaveMovedThisWordBackToStady: (word: Word) => string;
  renderDoYouWantToAddContext: () => string;
  renderSuggestedExampleQuestion: (example: string) => string;
  renderDoYouWantToAddPicture: () => string;
  renderYouAreAddingExistingWord: (word: string) => string;
  renderYouJustAddedNewWord: (word: Word) => string;
}

const languageTokenMap: {[key: string]: LanguageTranslations} = {
  en: {
    renderNoMoreWordsToLearnForToday: () => `You've covered all the words designated for learning today 🎉
Come back and repeat tomorrow!`,
    renderYouHaveCovered_N_Words: (wordCount) => `You've covered ${wordCount} words today`,
    renderYouHaveGoneThrough_N_Words: (wordCount) => `You've gone through ${wordCount} words! Great result 🎉`,
    renderNoMoreWordsToReviseForToday: () => `You've revised all your words for today 🎉
Come back and repeat tomorrow!`,
    renderYouHaveRevised_N_Words: (wordCount) => `You've revised ${wordCount} words today`,
    renderNoIdea: () => 'Have no idea what you want from me',
    renderSendMeContextForThisWord: () => escapeMarkdown('Send me a context (e.g. meaning, usage, etc.) for this word'),
    renderSendMePictureForThisWord: () => 'Send me a picture for this word',
    renderSendMeWordToAdd: () => 'Send me a word you want to add',
    renderSendMeTranslationForThisWord: () => 'Send me translation for this word',
    renderYouAreNotMyMaster: () => 'You are not my master, I am not your slave',
    renderYouHaveMovedThisWordBackToStady: (word) => `You've moved this word back to the learning list
${renderWordWithCustomStatus(word, mapWordProgressToStatus[word.Progress])}`,
    renderDoYouWantToAddContext: () => escapeMarkdown('Do you want to add some context (e.g. meaning, usage, etc.) to this word?'),
    renderSuggestedExampleQuestion: (example) => `I can suggest this example sentence:
"${escapeMarkdown(example)}"
Do you want to use it? Tap 'Yes' to keep it or 'No' to write your own example`,
    renderDoYouWantToAddPicture: () => 'Do you want to add any picture to this word?',
    renderYouAreAddingExistingWord: (word) => `You're adding the following word \\- __${word}__
There are already some similar words in your word list\\. Did you forget about them? 
Click on the correct word to move it to the 'Have Problems' state, or click 'Continue' if you are adding new word`,
    renderYouJustAddedNewWord: (word) => `You just added new word 🎉: 
${renderWordWithCustomStatus(word)}`,
  },
  pt: {
    renderNoMoreWordsToLearnForToday: () => `Cobriu todas as palavras designadas para aprendizado hoje 🎉
Volte e repita amanhã!`,
    renderYouHaveCovered_N_Words: (wordCount) => `Cobriu ${wordCount} palavras hoje`,
    renderYouHaveGoneThrough_N_Words: (wordCount) => `Passou por ${wordCount} palavras! Ótimo resultado 🎉`,
    renderNoMoreWordsToReviseForToday: () => `Revisou todas as suas palavras hoje 🎉
Volte e repita amanhã!`,
    renderYouHaveRevised_N_Words: (wordCount) => `Revisou ${wordCount} palavras hoje`,
    renderNoIdea: () => 'Não faço ideia do que quer de mim',
    renderSendMeContextForThisWord: () => escapeMarkdown('Envie-me um contexto (por exemplo, significado, uso, etc.) para esta palavra'),
    renderSendMePictureForThisWord: () => 'Envie\\-me uma imagem para esta palavra',
    renderSendMeWordToAdd: () => 'Envie\\-me uma palavra que deseja adicionar',
    renderSendMeTranslationForThisWord: () => 'Envie\\-me a tradução para esta palavra',
    renderYouAreNotMyMaster: () => 'Não é meu mestre, não sou seu escravo',
    renderYouHaveMovedThisWordBackToStady: (word) => `Moveu esta palavra de volta para a lista de aprendizado
${renderWordWithCustomStatus(word, mapWordProgressToStatus[word.Progress])}`,
    renderDoYouWantToAddContext: () => escapeMarkdown('Quer adicionar algum contexto (por exemplo, significado, uso, etc.) a esta palavra?'),
    renderSuggestedExampleQuestion: (example) => `Posso sugerir esta frase de exemplo:
"${escapeMarkdown(example)}"
Quer usá\\-la? Toque em 'Sim' para aceitá\-la ou em 'Não' para escrever seu próprio exemplo`,
    renderDoYouWantToAddPicture: () => 'Quer adicionar alguma imagem a esta palavra?',
    renderYouAreAddingExistingWord: (word) => `Está adicionando a seguinte palavra \\- __${word}__
Já existem palavras semelhantes em sua lista de palavras\\. Esqueceu delas? 
Clique na palavra correta para movê\-la para o estado 'Tem Problemas', ou clique em 'Continuar' se estiver adicionando uma nova palavra`,
    renderYouJustAddedNewWord: (word) => `Acabou de adicionar uma nova palavra 🎉: 
${renderWordWithCustomStatus(word)}`,
  },
};

const translations: LanguageTranslations = languageTokenMap[process.env.LANGUAGE_CODE?.startsWith('pt') ? 'pt' : 'en'];

const {
  renderNoMoreWordsToLearnForToday,
  renderYouHaveCovered_N_Words,
  renderYouHaveGoneThrough_N_Words,
  renderNoMoreWordsToReviseForToday,
  renderYouHaveRevised_N_Words,
  renderNoIdea,
  renderSendMeContextForThisWord,
  renderSendMePictureForThisWord,
  renderSendMeWordToAdd,
  renderSendMeTranslationForThisWord,
  renderYouAreNotMyMaster,
  renderYouHaveMovedThisWordBackToStady,
  renderDoYouWantToAddContext,
  renderSuggestedExampleQuestion,
  renderDoYouWantToAddPicture,
  renderYouAreAddingExistingWord,
  renderYouJustAddedNewWord,
} = translations;

export {
  renderNoMoreWordsToLearnForToday,
  renderYouHaveCovered_N_Words,
  renderYouHaveGoneThrough_N_Words,
  renderNoMoreWordsToReviseForToday,
  renderYouHaveRevised_N_Words,
  renderNoIdea,
  renderSendMeContextForThisWord,
  renderSendMePictureForThisWord,
  renderSendMeWordToAdd,
  renderSendMeTranslationForThisWord,
  renderYouAreNotMyMaster,
  renderYouHaveMovedThisWordBackToStady,
  renderDoYouWantToAddContext,
  renderSuggestedExampleQuestion,
  renderDoYouWantToAddPicture,
  renderYouAreAddingExistingWord,
  renderYouJustAddedNewWord,
};

export default translations;
