const {Step} = require('./step');
const {Progress} = require('../../repo/words');

const StepID = 'ADD_NEW_WORD';

/**
 * AddNewWord
 */
class AddNewWord extends Step {
  // eslint-disable-next-line
  /**
   * @param {import("../../repo/users").User} user
   * @return {[
   *    string,
   *    import('node-telegram-bot-api').InlineKeyboardButton[][] | null
   * ]}
   */
  makeAction = async () => {
    return ['Send me a word you want to add', null];
  };

  // eslint-disable-next-line
  /**
   * @param {string|null} userAnswer
   * @param {import("../../repo/users").User} user
   * @return {[Object, string]}
   */
  makeTransition = async (userAnswer, user) => {
    const lastRevisedDate = new Date();
    lastRevisedDate.setDate(lastRevisedDate.getDate() - 14);

    const newWord = {
      'English': userAnswer,
      'Progress': Progress.HaveProblems,
      'Last Revised': lastRevisedDate,
    };
    const newState = {
      ...user.state,
      newWord,
    };
    return [newState, this.nextStepID];
  };
}

module.exports = {
  AddNewWord,
  StepID,
};
