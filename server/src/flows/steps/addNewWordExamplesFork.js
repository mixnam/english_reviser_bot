const {labelYes, labelNo} = require('../../render/renderLabel');
const {renderDoYouWantToAddContext} = require('../../render/renderTextMsg');
const {Step} = require('./step');

const StepID = 'ADD_NEW_WORD_EXAMPLES_FORK';
const YesAnswer = labelYes;
const NoAnswer = labelNo;

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

  /**
   * @type {Step['makeAction']}
   */
  makeAction = async () => {
    return [
      renderDoYouWantToAddContext(),
      {
        keyboard: [[
          {
            text: YesAnswer,
          },
          {
            text: NoAnswer,
          },
        ]],
      },
      null,
      null,
    ];
  };

  /**
   * @type {Step['makeTransition']}
   */
  makeTransition = async (userAnswer, user) => {
    switch (userAnswer.text) {
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
