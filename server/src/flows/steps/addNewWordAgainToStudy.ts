import {Step} from './step.js';
import {renderYouHaveMovedThisWordBackToStady} from '../../render/renderTextMsg.js';
import {Word} from '../../repo/words.js';

const StepID = 'ADD_NEW_WORD_AGAIN_TO_STUDY';

/**
 * AddNewWordAgainToStudy
 */
class AddNewWordAgainToStudy extends Step {
  override async makeAction(...params: Parameters<Step['makeAction']>): ReturnType<Step['makeAction']> {
    const [user] = params;
    const word = user.state.wordToStudyAgain as Word;

    return [
      renderYouHaveMovedThisWordBackToStady(word),
      null,
      null,
      null,
      null,
    ];
  };

  override async makeTransition(): ReturnType<Step['makeTransition']> {
    return [null, this.nextStepID];
  };
}

export {
  AddNewWordAgainToStudy,
  StepID,
};
