const {renderSendMeContextForThisWord} = require('../../render/renderTextMsg');
const {Step} = require('./step');

const StepID = 'ADD_NEW_WORD_EXAMPLES';

/**
 * AddNewWordExamples
 */
class AddNewWordExamples extends Step {
  /**
   * @type {Step['makeAction']}
   */
  makeAction = async () => {
    return [
      renderSendMeContextForThisWord(),
      null,
      null,
      null,
      null,
    ];
  };

  /**
   * @type {Step['makeTransition']}
   */
  makeTransition = async (userAnswer, user) => {
    const {newWord} = user.state;
    if (!newWord) {
      // TODO throw Error
      return [null, StepID];
    }
    newWord.Examples = userAnswer.text;
    return [user.state, this.nextStepID];
  };
}

module.exports = {
  AddNewWordExamples,
  StepID,
};
