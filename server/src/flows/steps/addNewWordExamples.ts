import {renderSendMeContextForThisWord} from '../../render/renderTextMsg.js';
import {Step} from './step.js';
import {Word} from '../../repo/words.js';

const StepID = 'ADD_NEW_WORD_EXAMPLES';

/**
 * AddNewWordExamples
 */
class AddNewWordExamples extends Step {
  override async makeAction(): ReturnType<Step['makeAction']> {
    return [
      renderSendMeContextForThisWord(),
      null,
      null,
      null,
      null,
    ];
  };

  override async makeTransition(...params: Parameters<Step['makeTransition']>): ReturnType<Step['makeTransition']> {
    const [userAnswer, user] = params;
    const newWord = user.state.newWord as Word;
    if (!newWord) {
      // TODO throw Error
      return [null, StepID];
    }
    newWord.Examples = userAnswer.text;
    return [user.state, this.nextStepID];
  };
}

export {
  AddNewWordExamples,
  StepID,
};
