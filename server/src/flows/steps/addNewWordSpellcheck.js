const {Step} = require('./step');
const {Progress, setWordProgress, getWordByText} = require('../../repo/words');
const {renderYouAreAddingExistingWord} = require('../../render/renderTextMsg');
const {labelContinue} = require('../../render/renderLabel');

const StepID = 'ADD_NEW_WORD_SPELLCHECK';
const ThisIsNewWord = labelContinue;

/**
 * AddNewWordSpellcheck
 */
class AddNewWordSpellcheck extends Step {
  wordToStudyAgainStepID;

  /**
   * @param {string} nextStepID
   * @param {string} wordToStudyAgainStepID
   */
  constructor(nextStepID, wordToStudyAgainStepID) {
    super(nextStepID);
    this.wordToStudyAgainStepID = wordToStudyAgainStepID;
  }

  /**
   * @type {Step['makeAction']}
   */
  makeAction = async (user) => {
    const {
      suggestions,
      newWord,
    } = user.state;

    return [
      renderYouAreAddingExistingWord(newWord?.English ?? ''),
      {
        keyboard: [
          ...(suggestions
              ?.map((suggestion) => [{
                text: suggestion.English,
              }]) ?? []),
          [{text: ThisIsNewWord}],
        ],
      },
      null,
      null,
    ];
  };

  /**
   * @type {Step['makeTransition']}
   */
  makeTransition = async (msg, user) => {
    if (!msg.text) {
      // TODO throw Error
      return [null, StepID];
    }

    if (msg.text === ThisIsNewWord) {
      return [user.state, this.nextStepID];
    }

    const word = await getWordByText(msg.text);
    if (word instanceof Error) {
      console.error(word);
      return;
    }

    const result = setWordProgress(word._id, Progress.HaveProblems);
    if (result instanceof Error) {
      console.error(result);
      return;
    }
    const newState = {
      wordToStudyAgain: word,
    };

    return [newState, this.wordToStudyAgainStepID];
  };
}

module.exports = {
  AddNewWordSpellcheck,
  StepID,
};
