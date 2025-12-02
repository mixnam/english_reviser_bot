import {Step} from './step.js';

import {Progress, getSpelcheckSuggestions} from '../../repo/words.js';
import {renderSendMeWordToAdd} from '../../render/renderTextMsg.js';
import {Word} from '../../repo/words.js';

const StepID = 'ADD_NEW_WORD';

/**
 * AddNewWord
 */
class AddNewWord extends Step {
  spellcheckStepID: string;

  /**
   * @param {string} nextStepID
   * @param {string} spellcheckStepID
   */
  constructor(nextStepID: string, spellcheckStepID: string) {
    super(nextStepID);
    this.spellcheckStepID = spellcheckStepID;
  }

  override async makeAction(): ReturnType<Step['makeAction']> {
    return [renderSendMeWordToAdd(), (chatID) => ({
      inline_keyboard: [
        [
          {
            text: 'Add word',
            web_app: {
              url: process.env.TMA_URL +
                '#/add-word?&chat_id=' + chatID,
            },
          },
        ],
      ],
    }),
    null, null, null];
  };

  override async makeTransition(...params: Parameters<Step['makeTransition']>): ReturnType<Step['makeTransition']> {
    const [msg, user, , logger] = params;
    const {text} = msg;
    if (!text) {
      // TODO
      return [null, StepID];
    }

    const lastRevisedDate = new Date();
    lastRevisedDate.setDate(lastRevisedDate.getDate() - 14);

    const newWord: Partial<Word> = {
      'English': text,
      'Progress': Progress.HaveProblems,
      'Last Revised': lastRevisedDate,
    };
    let suggestions = await getSpelcheckSuggestions(text, user._id, logger);
    if (suggestions instanceof Error) {
      logger.error({err: suggestions}, 'getSpelcheckSuggestions error');
      suggestions = [];
    }

    const newState = {
      ...user.state,
      newWord,
      suggestions,
    };

    if (suggestions.length > 0) {
      return [newState, this.spellcheckStepID];
    }

    return [newState, this.nextStepID];
  };
}

export {
  AddNewWord,
  StepID,
};
