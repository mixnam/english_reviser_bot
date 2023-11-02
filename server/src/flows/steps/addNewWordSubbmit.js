const {Step} = require('./step');
const {renderWordWithCustomStatus} = require('../../render/renderWord');
const {addNewWord} = require('../../repo/words');

const StepID = 'ADD_NEW_WORD_SUBBMIT';

/**
 * AddNewWordSubbmit
 */
class AddNewWordSubbmit extends Step {
  // eslint-disable-next-line
  /**
   * @param {import("../../repo/users").User} user
   * @return {[
   *    string,
   *    import('node-telegram-bot-api').InlineKeyboardButton[][] | null,
   * ]}
   */
  makeAction = async (user) => {
    const {newWord} = user.state;
    const result = await addNewWord(user._id, newWord);
    if (result !== null) {
      console.error(result);
      return;
    }
    return [
      `You just added new word 🎉: 
${renderWordWithCustomStatus(newWord)}`,
      null,
    ];
  };

  // eslint-disable-next-line
  /**
   * @param {string|null} userAnswer
   * @param {import("../../repo/users").User} user
   * @return {[Object, string]}
   */
  makeTransition = async (userAnswer, user) => {
    return [null, this.nextStepID];
  };
}

module.exports = {
  AddNewWordSubbmit,
  StepID,
};
