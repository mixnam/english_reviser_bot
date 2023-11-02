const {Step} = require('./step');

const StepID = 'ADD_NEW_WORD_EXAMPLES';

/**
 * AddNewWordExamples
 */
class AddNewWordExamples extends Step {
  // eslint-disable-next-line
  /**
   * @param {import("../../repo/users").User} user
   * @return {[
   *    string,
   *    import('node-telegram-bot-api').InlineKeyboardButton[][] | null
   * ]}
   */
  makeAction = async () => {
    return ['Send me a context/examples for this word', null];
  };

  // eslint-disable-next-line
  /**
   * @param {string|null} userAnswer
   * @param {import("../../repo/users").User} user
   * @return {[Object, string]}
   */
  makeTransition = async (userAnswer, user) => {
    const {newWord} = user.state;
    newWord.Examples = userAnswer;
    return [user.state, this.nextStepID];
  };
}

module.exports = {
  AddNewWordExamples,
  StepID,
};
