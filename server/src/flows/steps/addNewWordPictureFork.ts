import {labelYes, labelNo} from '../../render/renderLabel.js';
import {renderDoYouWantToAddPicture} from '../../render/renderTextMsg.js';
import {Step} from './step.js';

const StepID = 'ADD_NEW_WORD_PICTURE_FORK';
const YesAnswer = labelYes;
const NoAnswer = labelNo;

/**
 * AddNewWordPictureFork
 */
class AddNewWordPictureFork extends Step {
  noStepID: string;

  constructor(yesStepID: string, noStepID: string) {
    super(yesStepID);
    this.noStepID = noStepID;
  }

  override makeAction = async (): ReturnType<Step['makeAction']> => {
    return [
      renderDoYouWantToAddPicture(),
      () => ({
        keyboard: [[
          {
            text: YesAnswer,
          },
          {
            text: NoAnswer,
          },
        ]],
      }),
      null,
      null,
      null,
    ];
  };

  override makeTransition = async (...params: Parameters<Step['makeTransition']>): ReturnType<Step['makeTransition']> => {
    const [userAnswer, user] = params;
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

export {
  AddNewWordPictureFork,
  StepID,
};
