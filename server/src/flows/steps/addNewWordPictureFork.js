const {labelYes, labelNo} = require('../../render/renderLabel');
const {renderDoYouWantToAddPicture} = require('../../render/renderTextMsg');
const {Step} = require('./step');

const StepID = 'ADD_NEW_WORD_PICTURE_FORK';
const YesAnswer = labelYes;
const NoAnswer = labelNo;

/**
 * AddNewWordPictureFork
 */
class AddNewWordPictureFork extends Step {
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
      renderDoYouWantToAddPicture(),
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
  AddNewWordPictureFork,
  StepID,
};
