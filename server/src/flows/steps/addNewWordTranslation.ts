import {renderSendMeTranslationForThisWord} from '../../render/renderTextMsg.js';
import {Step} from './step.js';

const StepID = 'ADD_NEW_WORD_TRANSLATIONS';

class AddNewWordTranslations extends Step {
  override makeAction = async (): ReturnType<Step['makeAction']> => {
    return [
      renderSendMeTranslationForThisWord(),
      null,
      null,
      null,
      null,
    ];
  };

  override makeTransition = async (...params: Parameters<Step['makeTransition']>): ReturnType<Step['makeTransition']> => {
    const [msg, user] = params;

    if (!user.state || !user.state.newWord || !msg.text) {
      // TODO throw Error
      return [null, StepID] as const;
    }
    const {newWord} = user.state;
    newWord.Translation = msg.text;
    return [user.state, this.nextStepID];
  };
}

export {
  AddNewWordTranslations,
  StepID,
};
