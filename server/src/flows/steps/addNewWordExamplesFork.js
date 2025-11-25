const {labelYes, labelNo} = require('../../render/renderLabel');
const {
  renderDoYouWantToAddContext,
  renderSuggestedExampleQuestion,
} = require('../../render/renderTextMsg');
const {OpenAIExamplesService} = require('../../services/openAIExamples');
const {setUserState} = require('../../repo/users');
const {Step} = require('./step');

const StepID = 'ADD_NEW_WORD_EXAMPLES_FORK';
const YesAnswer = labelYes;
const NoAnswer = labelNo;

/**
 * AddNewWordExamplesFork
 */
class AddNewWordExamplesFork extends Step {
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
  makeAction = async (user, logger) => {
    const {state, _id: userID} = user;
    const newWord = state?.newWord;
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
        logger.error(aiExample);
      } else if (aiExample) {
        suggestedExample = aiExample;
        const newState = {
          ...state,
          suggestedExample,
        };
        const updateResult = await setUserState(userID, newState, logger);
        if (updateResult instanceof Error) {
          logger.error(updateResult);
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

  /**
   * @type {Step['makeTransition']}
   */
  makeTransition = async (userAnswer, user) => {
    if (!user.state || !user.state.newWord) {
      return [user.state, StepID];
    }

    const suggestedExample = user.state?.suggestedExample ?? null;
    const newWord = user.state.newWord;

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

module.exports = {
  AddNewWordExamplesFork,
  StepID,
};
