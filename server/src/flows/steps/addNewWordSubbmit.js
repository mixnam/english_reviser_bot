const {Step} = require('./step');
const {renderWordWithCustomStatus} = require('../../render/renderWord');
const {addNewWord, setWordTelegramAudioID} = require('../../repo/words');
const {TTSService} = require('../../tts/tts');

const StepID = 'ADD_NEW_WORD_SUBBMIT';

/**
 * AddNewWordSubbmit
 */
class AddNewWordSubbmit extends Step {
  /**
   * @inheritdoc
   */
  makeAction = async (user) => {
    /**
     * @type {import('../../repo/words').Word}
     */
    const {newWord} = user.state;

    const audio = await TTSService.getAudioForText(newWord.English);
    if (audio instanceof Error) {
      console.error(audio);
    } else {
      newWord.Audio = audio;
    }

    const newWordID = await addNewWord(user._id, newWord);
    if (newWordID instanceof Error) {
      console.error(newWordID);
      return;
    }
    return [
      `You just added new word 🎉: 
${renderWordWithCustomStatus(newWord)}`,
      null,
      audio,
      (fileID) => {
        setWordTelegramAudioID(newWordID, fileID)
            .catch((err) => console.log(err));
      },
    ];
  };

  // eslint-disable-next-line
  /**
   * @param {string|null} userAnswer
   * @param {import("../../repo/users").User} user
   * @return {[Object, string]}
   */
  makeTransition = async (userAnswer, user) => {
    return [null, this.nextStepID];
  };
}

module.exports = {
  AddNewWordSubbmit,
  StepID,
};
