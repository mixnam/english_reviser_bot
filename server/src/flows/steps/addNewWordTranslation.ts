import {renderSendMeTranslationForThisWord} from '../../render/renderTextMsg.js';
import {Step} from './step.js';

const StepID = 'ADD_NEW_WORD_TRANSLATIONS';

class AddNewWordTranslations extends Step {
  override async makeAction(): ReturnType<Step['makeAction']> {
    return [
      renderSendMeTranslationForThisWord(),
      null,
      null,
      null,
      null,
    ];
  };

  override async makeTransition(...params: Parameters<Step['makeTransition']>): ReturnType<Step['makeTransition']> {
    const [msg, user] = params;

    const {newWord} = user.state;
    if (!newWord || !msg.text) {
      // TODO throw Error
      return [null, StepID] as const;
    }
    newWord.Translation = msg.text;
    return [user.state, this.nextStepID];
  };
}

export {
  AddNewWordTranslations,
  StepID,
};
