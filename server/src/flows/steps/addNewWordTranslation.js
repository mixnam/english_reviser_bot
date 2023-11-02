const {Step} = require('./step');

const StepID = 'ADD_NEW_WORD_TRANSLATIONS';

/**
 * AddNewWordTranslations
 */
class AddNewWordTranslations extends Step {
  // eslint-disable-next-line
  /**
   * @param {import("../../repo/users").User} user
   * @return {[
   *    string,
   *    import('node-telegram-bot-api').InlineKeyboardButton[][] | null
   * ]}
   */
  makeAction = async () => {
    return ['Send me translation for this word', null];
  };

  // eslint-disable-next-line
  /**
   * @param {string|null} userAnswer
   * @param {import("../../repo/users").User} user
   * @return {[Object, string]}
   */
  makeTransition = async (userAnswer, user) => {
    const {newWord} = user.state;
    newWord.Translation = userAnswer;
    return [user.state, this.nextStepID];
  };
}

module.exports = {
  AddNewWordTranslations,
  StepID,
};
