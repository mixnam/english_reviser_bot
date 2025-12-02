import {labelYes, labelNo} from '../../render/renderLabel.js';
import {
  renderDoYouWantToAddContext,
  renderSuggestedExampleQuestion,
} from '../../render/renderTextMsg.js';
import {OpenAIExamplesService} from '../../services/openAIExamples.js';
import {setUserState} from '../../repo/users.js';
import {Step} from './step.js';
import {Word} from '../../repo/words.js';

const StepID = 'ADD_NEW_WORD_EXAMPLES_FORK';
const YesAnswer = labelYes;
const NoAnswer = labelNo;

/**
 * AddNewWordExamplesFork
 */
class AddNewWordExamplesFork extends Step {
  noStepID: string;

  constructor(yesStepID: string, noStepID: string) {
    super(yesStepID);
    this.noStepID = noStepID;
  }

  override makeAction = async (...params: Parameters<Step['makeAction']>): ReturnType<Step['makeAction']> => {
    const [user, logger] = params;
    const {state, _id: userID} = user;
    const newWord = state?.newWord as Word;
    if (!newWord) {
      return new Error('Impossible state: no newWord');
    }

    let suggestedExample = state?.suggestedExample ?? null;

    if (!suggestedExample) {
      const aiExample = await OpenAIExamplesService.generateExampleSentence(
          newWord.English,
          newWord.Translation,
          process.env.LANGUAGE_CODE,
          logger,
      );
      if (aiExample instanceof Error) {
        logger.error({err: aiExample}, 'generateExampleSentence error');
      } else if (aiExample) {
        suggestedExample = aiExample;
        const newState = {
          ...state,
          suggestedExample,
        };
        const updateResult = await setUserState(userID, newState, logger);
        if (updateResult instanceof Error) {
          logger.error({err: updateResult}, 'setUserState error');
        } else {
          user.state = newState;
        }
      }
    }

    return [
      suggestedExample ?
        renderSuggestedExampleQuestion(suggestedExample) :
        renderDoYouWantToAddContext(),
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
    if (!user.state || !user.state.newWord) {
      return [user.state, StepID];
    }

    const suggestedExample = user.state?.suggestedExample ?? null;
    const newWord = user.state.newWord as Word;

    switch (userAnswer.text) {
      case YesAnswer:
        if (suggestedExample && newWord) {
          newWord.Examples = suggestedExample;
          const newState = {
            ...user.state,
          };
          delete newState.suggestedExample;
          return [newState, this.noStepID];
        }
        return [user.state, this.nextStepID];
      case NoAnswer:
        if (suggestedExample) {
          const newState = {...user.state};
          delete newState.suggestedExample;
          return [newState, this.nextStepID];
        }
        return [user.state, this.noStepID];
      default:
        return [user.state, StepID];
    }
  };
}

export {
  AddNewWordExamplesFork,
  StepID,
};
