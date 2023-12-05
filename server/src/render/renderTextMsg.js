const {
  renderWordWithCustomStatus,
  mapWordProgressToStatus,
} = require('./renderWord');

/**
 * @returns string
 */
const renderNoMoreWordsToLearnForToday = () => `You've covered all the words designated for learning today 🎉
Come back and repeat tomorrow!`;

/**
 * @param {number} wordCount
 * @returns strng
 */
const renderYouHaveCovered_N_Words = (wordCount) => `You've covered ${wordCount} words today`;

/**
 * @param {number} wordCount
 * @returns string
 */
const renderYouHaveGoneThrough_N_Words = (wordCount) => `You've gone through ${wordCount} words! Great result 🎉`;

/**
 * @returns string
 */
const renderNoMoreWordsToReviseForToday = () => `You've revised all your words for today 🎉
Come back and repeat tomorrow!`;

/**
 * @param {number} wordCount
 * @returns string
 */
const renderYouHaveRevised_N_Words = (wordCount) => `You've revised ${wordCount} words today`;

/**
 * @returns string
 */
const renderNoIdea = () => 'Have no idea what you want from me';

/**
 * @returns string
 */
const renderSendMeContextForThisWord = () => 'Send me a context/examples for this word';

/**
 * @returns string
 */
const renderSendMeWordToAdd = () => 'Send me a word you want to add';

/**
 * @returns string
 */
const renderSendMeTranslationForThisWord = () => 'Send me translation for this word';

/**
 * @returns string
 */
const renderYouAreNotMyMaster = () => 'You are not my master, I am not your slave';

/**
 * @param {import("../repo/words").Word} word
 * @returns
 */
const renderYouHaveMovedThisWordBackToStady = (word) => `You've moved this word back to the learning list
${renderWordWithCustomStatus(word, mapWordProgressToStatus[word.Progress])}`;

/**
 * @returns string
 */
const renderDoYouWantToAddContext = () => 'Do you want to add some context/examples to this word?';

/**
 * @param {string} word
 * @returns string
 */
const renderYouAreAddingExistingWord = (word) => `You're adding the following word \\- __${word}__

There are already some similar words in your word list\\. Did you forget about them? 
Click on the correct word to move it to the 'Have Problems' state, or click 'Continue' if you are adding new word`;

/**
 * @param {Pick<import('../repo/words').Word, 'English' | 'Translation' | 'Examples'>} word
 * @returns string
 */
const renderYouJustAddedNewWord = (word) => `You just added new word 🎉: 
${renderWordWithCustomStatus(word)}`;

module.exports = {
  renderDoYouWantToAddContext,
  renderNoIdea,
  renderNoMoreWordsToLearnForToday,
  renderNoMoreWordsToReviseForToday,
  renderSendMeContextForThisWord,
  renderSendMeTranslationForThisWord,
  renderSendMeWordToAdd,
  renderYouAreAddingExistingWord,
  renderYouHaveCovered_N_Words,
  renderYouHaveGoneThrough_N_Words,
  renderYouHaveMovedThisWordBackToStady,
  renderYouAreNotMyMaster,
  renderYouHaveRevised_N_Words,
  renderYouJustAddedNewWord,
};

