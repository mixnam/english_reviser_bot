const {Step} = require('./step');
const {
  renderWordWithCustomStatus,
  mapWordProgressToStatus,
} = require('../../render/renderWord');
const { renderYouHaveMovedThisWordBackToStady } = require('../../render/renderTextMsg');

const StepID = 'ADD_NEW_WORD_AGAIN_TO_STUDY';

/**
 * AddNewWordAgainToStudy
 */
class AddNewWordAgainToStudy extends Step {
  // eslint-disable-next-line
  /**
   * @param {import("../../repo/users").User} user
   * @return {[
   *    string,
   *    import('node-telegram-bot-api').InlineKeyboardButton[][] | null
   * ]}
   */
  makeAction = async (user) => {
    const word = user.state.wordToStudyAgain;

    return [
      renderYouHaveMovedThisWordBackToStady(word),
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
  AddNewWordAgainToStudy,
  StepID,
};
