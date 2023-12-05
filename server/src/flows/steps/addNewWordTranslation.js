const {renderSendMeTranslationForThisWord} = require('../../render/renderTextMsg');
const {Step} = require('./step');

const StepID = 'ADD_NEW_WORD_TRANSLATIONS';

/**
 * AddNewWordTranslations
 */
class AddNewWordTranslations extends Step {
  /**
   * @type {Step['makeAction']}
   */
  makeAction = async () => {
    return [renderSendMeTranslationForThisWord(), null, null, null];
  };

  /**
   * @type {Step['makeTransition']}
   */
  makeTransition = async (msg, user) => {
    const {newWord} = user.state;
    if (!newWord || !msg.text) {
      // TODO throw Error
      return [null, StepID];
    }
    newWord.Translation = msg.text;
    return [user.state, this.nextStepID];
  };
}

module.exports = {
  AddNewWordTranslations,
  StepID,
};
