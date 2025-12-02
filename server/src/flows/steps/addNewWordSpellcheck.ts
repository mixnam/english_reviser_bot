import {Step} from './step.js';
import {Progress, setWordProgress, getWordByText, Word} from '../../repo/words.js';
import {renderYouAreAddingExistingWord} from '../../render/renderTextMsg.js';
import {labelContinue} from '../../render/renderLabel.js';

const StepID = 'ADD_NEW_WORD_SPELLCHECK';
const ThisIsNewWord = labelContinue;

/**
 * AddNewWordSpellcheck
 */
class AddNewWordSpellcheck extends Step {
  wordToStudyAgainStepID: string;

  constructor(nextStepID: string, wordToStudyAgainStepID: string) {
    super(nextStepID);
    this.wordToStudyAgainStepID = wordToStudyAgainStepID;
  }

  override async makeAction(...params: Parameters<Step['makeAction']>): ReturnType<Step['makeAction']> {
    const [user] = params;
    if (!user.state) {
      return new Error('Impossible state: no state');
    }
    const {
      suggestions,
      newWord,
    } = user.state;

    return [
      renderYouAreAddingExistingWord((newWord as Word)?.English ?? ''),
      () => ({
        keyboard: [
          ...(suggestions
              ?.map((suggestion: { English: string }) => [{
                text: suggestion.English,
              }]) ?? []),
          [{text: ThisIsNewWord}],
        ],
      }),
      null,
      null,
      null,
    ];
  };

  override async makeTransition(...params: Parameters<Step['makeTransition']>): ReturnType<Step['makeTransition']> {
    const [msg, user, , logger] = params;
    if (!msg.text) {
      // TODO throw Error
      return [null, StepID];
    }

    if (msg.text === ThisIsNewWord) {
      return [user.state, this.nextStepID];
    }

    const word = await getWordByText(msg.text, logger);
    if (word instanceof Error) {
      logger.error({err: word}, 'getWordByText error');
      return [null, StepID];
    }

    // If getWordByText returns null, it means the word doesn't exist, which is weird if it came from suggestions
    // But if it's null, we can't proceed.
    if (!word) {
      logger.error({text: msg.text}, 'Word found in suggestions but not in DB');
      return [null, StepID];
    }

    const result = setWordProgress(word._id, Progress.HaveProblems, logger);
    if (result instanceof Error) {
      logger.error({err: result}, 'setWordProgress error');
      return [null, StepID];
    }
    const newState = {
      wordToStudyAgain: word,
    };

    return [newState, this.wordToStudyAgainStepID];
  };
}

export {
  AddNewWordSpellcheck,
  StepID,
};
