const {Step} = require('./step');
const {Progress, setWordProgress, getWordByText} = require('../../repo/words');

const StepID = 'ADD_NEW_WORD_SPELLCHECK';
const ThisIsNewWord = 'Continue';

/**
 * AddNewWordSpellcheck
 */
class AddNewWordSpellcheck extends Step {
  wordToStudyAgainStepID;

  /**
   * @param {string} nextStepID
   * @param {string} wordToStudyAgainStepID
   */
  constructor(nextStepID, wordToStudyAgainStepID) {
    super(nextStepID);
    this.wordToStudyAgainStepID = wordToStudyAgainStepID;
  }

  // eslint-disable-next-line
  /**
   * @param {import("../../repo/users").User} user
   * @return {[
   *    string,
   *    import('node-telegram-bot-api').InlineKeyboardButton[][] | null
   * ]}
   */
  makeAction = async (user) => {
    const {
      suggestions,
      newWord,
    } = user.state;

    return [
      `You'are adding following word \\- __${newWord.English}__

There are already some similar words in your word list. Did you forget about them? 
Click on the correct word to move it to the 'Have Problems' state, or click 'Continue' if you are adding new word`, [
        ...(suggestions.map((suggestion) => [suggestion.English])),
        [ThisIsNewWord],
      ],
    ];
  };

  // eslint-disable-next-line
  /**
   * @param {string|null} userAnswer
   * @param {import("../../repo/users").User} user
   * @return {[Object, string]}
   */
  makeTransition = async (userAnswer, user) => {
    if (userAnswer === ThisIsNewWord) {
      return [user.state, this.nextStepID];
    }


    const word = await getWordByText(userAnswer);
    if (word instanceof Error) {
      console.error(word);
      return;
    }

    const result = setWordProgress(word._id, Progress.HaveProblems);
    if (result instanceof Error) {
      console.error(result);
      return;
    }
    const newState = {
      wordToStudyAgain: word,
    };

    return [newState, this.wordToStudyAgainStepID];
  };
}

module.exports = {
  AddNewWordSpellcheck,
  StepID,
};
