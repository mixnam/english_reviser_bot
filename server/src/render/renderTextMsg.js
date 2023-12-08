const {renderWordWithCustomStatus, mapWordProgressToStatus} = require('./renderWord');
const {escapeMarkdown} = require('telegram-escape');

/**
 * @typedef {Object} LanguageTranslations
 * @property {() => string} renderNoMoreWordsToLearnForToday - Translation for 'No more words to learn for today'.
 * @property {(wordCount: number) => string} renderYouHaveCovered_N_Words - Translation for 'You have covered N words'.
 * @property {(wordCount: number) => string} renderYouHaveGoneThrough_N_Words - Translation for 'You have gone through N words'.
 * @property {() => string} renderNoMoreWordsToReviseForToday - Translation for 'No more words to revise for today'.
 * @property {(wordCount: number) => string} renderYouHaveRevised_N_Words - Translation for 'You have revised N words'.
 * @property {() => string} renderNoIdea - Translation for 'Have no idea what you want from me'.
 * @property {() => string} renderSendMeContextForThisWord - Translation for 'Send me a context (e.g., meaning, usage, etc.) for this word'.
 * @property {() => string} renderSendMePictureForThisWord - Translation for 'Send me a picture for this word'.
 * @property {() => string} renderSendMeWordToAdd - Translation for 'Send me a word you want to add'.
 * @property {() => string} renderSendMeTranslationForThisWord - Translation for 'Send me translation for this word'.
 * @property {() => string} renderYouAreNotMyMaster - Translation for 'You are not my master, I am not your slave'.
 * @property {(word: import("../repo/words").Word) => string} renderYouHaveMovedThisWordBackToStady - Translation for 'You have moved this word back to the learning list'.
 * @property {() => string} renderDoYouWantToAddContext - Translation for 'Do you want to add some context (e.g., meaning, usage, etc.) to this word?'.
 * @property {() => string} renderDoYouWantToAddPicture - Translation for 'Do you want to add any picture to this word?'.
 * @property {(word: string) => string} renderYouAreAddingExistingWord - Translation for 'You are adding the following word'.
 * @property {(word: import("../repo/words").Word) => string} renderYouJustAddedNewWord - Translation for 'You just added new word'.
 */

/**
 * @type {Object.<string, LanguageTranslations>}
 */
const languageTokenMap = {
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
    renderYouHaveMovedThisWordBackToStady: (word) => `You've moved this word back to the learning list\n${renderWordWithCustomStatus(word, mapWordProgressToStatus[word.Progress])}`,
    renderDoYouWantToAddContext: () => escapeMarkdown('Do you want to add some context (e.g. meaning, usage, etc.) to this word?'),
    renderDoYouWantToAddPicture: () => 'Do you want to add any picture to this word?',
    renderYouAreAddingExistingWord: (word) => `You're adding the following word \\- __${word}__\nThere are already some similar words in your word list\\. Did you forget about them? \nClick on the correct word to move it to the 'Have Problems' state, or click 'Continue' if you are adding new word`,
    renderYouJustAddedNewWord: (word) => `You just added new word 🎉: \n${renderWordWithCustomStatus(word)}`,
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
    renderSendMePictureForThisWord: () => 'Envie-me uma imagem para esta palavra',
    renderSendMeWordToAdd: () => 'Envie-me uma palavra que deseja adicionar',
    renderSendMeTranslationForThisWord: () => 'Envie-me a tradução para esta palavra',
    renderYouAreNotMyMaster: () => 'Não é meu mestre, não sou seu escravo',
    renderYouHaveMovedThisWordBackToStady: (word) => `Moveu esta palavra de volta para a lista de aprendizado\n${renderWordWithCustomStatus(word, mapWordProgressToStatus[word.Progress])}`,
    renderDoYouWantToAddContext: () => escapeMarkdown('Quer adicionar algum contexto (por exemplo, significado, uso, etc.) a esta palavra?'),
    renderDoYouWantToAddPicture: () => 'Quer adicionar alguma imagem a esta palavra?',
    renderYouAreAddingExistingWord: (word) => `Está adicionando a seguinte palavra \\- __${word}__\nJá existem palavras semelhantes em sua lista de palavras\\. Esqueceu delas? \nClique na palavra correta para movê-la para o estado 'Tem Problemas', ou clique em 'Continuar' se estiver adicionando uma nova palavra`,
    renderYouJustAddedNewWord: (word) => `Acabou de adicionar uma nova palavra 🎉: \n${renderWordWithCustomStatus(word)}`,
  },
};

/**
 * @type {LanguageTranslations}
 */
const translations = languageTokenMap[process.env.LANGUAGE_CODE.startsWith('pt') ? 'pt' : 'en'];

module.exports = translations;
