const {Step} = require('./step');
const {addNewWord, setWordTelegramAudioID} = require('../../repo/words');
const {TTSService} = require('../../tts/tts');
const {renderYouJustAddedNewWord} = require('../../render/renderTextMsg');

const StepID = 'ADD_NEW_WORD_SUBBMIT';

/**
 * AddNewWordSubbmit
 */
class AddNewWordSubbmit extends Step {
  /**
   * @type {Step['makeAction']}
   */
  makeAction = async (user) => {
    const newWord = /** @type {import('../../repo/words').Word} */ (user.state.newWord);
    if (!newWord) {
      return new Error('impossible state, no newWord');
    }

    const audio = await TTSService.getAudioForText(newWord.English);
    if (audio instanceof Error) {
      return audio;
    } else {
      newWord.Audio = audio;
    }

    const newWordID = await addNewWord(user._id, newWord);
    if (newWordID instanceof Error) {
      return newWordID;
    }
    return [
      renderYouJustAddedNewWord(newWord),
      null,
      audio,
      (fileID) => {
        setWordTelegramAudioID(newWordID, fileID)
            .catch((err) => console.log(err));
      },
    ];
  };

  /**
   * @type {Step['makeTransition']}
   */
  makeTransition = async () => {
    return [null, this.nextStepID];
  };
}

module.exports = {
  AddNewWordSubbmit,
  StepID,
};
