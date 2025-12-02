import {renderSendMeContextForThisWord} from '../../render/renderTextMsg.js';
import {Word} from '../../repo/words.js';
import {Step} from './step.js';

const StepID = 'ADD_NEW_WORD_EXAMPLES';

/**
 * AddNewWordExamples
 */
class AddNewWordExamples extends Step {
  override makeAction = async (): ReturnType<Step['makeAction']> => {
    return [
      renderSendMeContextForThisWord(),
      null,
      null,
      null,
      null,
    ];
  };

  override makeTransition = async (...params: Parameters<Step['makeTransition']>): ReturnType<Step['makeTransition']> => {
    const [userAnswer, user] = params;
    if (!user.state || !user.state.newWord) {
      // TODO throw Error
      return [null, StepID];
    }
    const newWord = user.state.newWord as Word;
    newWord.Examples = userAnswer.text;
    return [user.state, this.nextStepID];
  };
}

export {
  AddNewWordExamples,
  StepID,
};
