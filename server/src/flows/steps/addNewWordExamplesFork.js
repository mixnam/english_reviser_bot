const {Step} = require('./step');

const StepID = 'ADD_NEW_WORD_EXAMPLES_FORK';
const YesAnswer = 'Yes';
const NoAnswer = 'No';

/**
 * AddNewWordExamplesFork
 */
class AddNewWordExamplesFork extends Step {
  noStepID;

  /**
     * @param {string} yesStepID
     * @param {string} noStepID
     */
  constructor(yesStepID, noStepID) {
    super(yesStepID);
    this.noStepID = noStepID;
  }

  // eslint-disable-next-line
  /**
   * @param {import("../../repo/users").User} user
   * @return {[
   *    string,
   *    import('node-telegram-bot-api').InlineKeyboardButton[][] | null
   * ]}
   */
  makeAction = async () => {
    return ['Do you want to add some context/examples to this word?', [[
      {
        text: YesAnswer,
      },
      {
        text: NoAnswer,
      },
    ]]];
  };

  // eslint-disable-next-line
  /**
   * @param {string|null} userAnswer
   * @param {import("../../repo/users").User} user
   * @return {[Object, string]}
   */
  makeTransition = async (userAnswer, user) => {
    switch (userAnswer) {
      case YesAnswer:
        return [user.state, this.nextStepID];
      case NoAnswer:
        return [user.state, this.noStepID];
      default:
        return [user.state, StepID];
    }
  };
}

module.exports = {
  AddNewWordExamplesFork,
  StepID,
};
