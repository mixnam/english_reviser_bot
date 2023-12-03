const {Step} = require('./step');
const {Progress, getSpelcheckSuggestions} = require('../../repo/words');
const { renderSendMeWordToAdd } = require('../../render/renderTextMsg');

const StepID = 'ADD_NEW_WORD';

/**
 * AddNewWord
 */
class AddNewWord extends Step {
  spellcheckStepID;

  /**
   * @param {string} nextStepID
   * @param {string} spellcheckStepID
   */
  constructor(nextStepID, spellcheckStepID) {
    super(nextStepID);
    this.spellcheckStepID = spellcheckStepID;
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
    return [renderSendMeWordToAdd(), null];
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
    let suggestions = await getSpelcheckSuggestions(userAnswer, user._id);
    if (suggestions instanceof Error) {
      console.error(suggestions);
      suggestions = [];
    }

    const newState = {
      ...user.state,
      newWord,
      suggestions,
    };

    if (suggestions.length > 0) {
      return [newState, this.spellcheckStepID];
    }

    return [newState, this.nextStepID];
  };
}

module.exports = {
  AddNewWord,
  StepID,
};
