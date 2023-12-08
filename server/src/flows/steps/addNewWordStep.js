const {Step} = require('./step');
const {Progress, getSpelcheckSuggestions} = require('../../repo/words');
const {renderSendMeWordToAdd} = require('../../render/renderTextMsg');

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

  /**
   * @type {Step['makeAction']}
   */
  makeAction = async () => {
    return [renderSendMeWordToAdd(), null, null, null, null];
  };

  /**
   * @type {Step['makeTransition']}
   */
  makeTransition = async (msg, user) => {
    const {text} = msg;
    if (!text) {
      // TODO
      return [null, StepID];
    }

    const lastRevisedDate = new Date();
    lastRevisedDate.setDate(lastRevisedDate.getDate() - 14);

    /**
     * @type {Partial<import('../../repo/words').Word>}
     */
    const newWord = {
      'English': text,
      'Progress': Progress.HaveProblems,
      // @ts-ignore
      'Last Revised': lastRevisedDate,
    };
    let suggestions = await getSpelcheckSuggestions(text, user._id);
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
