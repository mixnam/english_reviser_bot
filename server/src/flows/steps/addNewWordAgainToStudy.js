import {Step} from './step.js';
import {renderYouHaveMovedThisWordBackToStady} from '../../render/renderTextMsg.js';

const StepID = 'ADD_NEW_WORD_AGAIN_TO_STUDY';

/**
 * AddNewWordAgainToStudy
 */
class AddNewWordAgainToStudy extends Step {
  /**
   * @type {Step['makeAction']}
   */
  makeAction = async (user) => {
    const word = user.state.wordToStudyAgain;

    return [
      renderYouHaveMovedThisWordBackToStady(word),
      null,
      null,
      null,
      null,
    ];
  };

  /**
   * @type {Step['makeTransition']}
   */
  makeTransition = async () => {
    return [null, this.nextStepID];
  };
}

export {
  AddNewWordAgainToStudy,
  StepID,
};
