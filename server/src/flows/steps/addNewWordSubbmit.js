const {Step} = require('./step');
const {addNewWord, setWordTelegramAudioID} = require('../../repo/words');
const {TTSService} = require('../../tts/openaiTts');
const {renderYouJustAddedNewWord} = require('../../render/renderTextMsg');

const StepID = 'ADD_NEW_WORD_SUBBMIT';

/**
 * AddNewWordSubbmit
 */
class AddNewWordSubbmit extends Step {
  /**
   * @type {Step['makeAction']}
   */
  makeAction = async (user, logger) => {
    const newWord = /** @type {import('../../repo/words').Word} */ (user.state.newWord);
    if (!newWord) {
      return new Error('impossible state, no newWord');
    }

    const ttsText = newWord.Examples?.trim().length > 0 ?
      newWord.Examples :
      newWord.English;

    const audio = await TTSService.getAudioForText(ttsText);
    if (audio instanceof Error) {
      return audio;
    } else {
      newWord.Audio = audio;
    }

    const newWordID = await addNewWord(user._id, newWord, logger);
    if (newWordID instanceof Error) {
      return newWordID;
    }

    return [
      renderYouJustAddedNewWord(newWord),
      null,
      audio,
      async (fileID) =>
        setWordTelegramAudioID(newWordID, fileID, logger)
            .then(() => null)
            .catch((err) => logger.error(err)),
      newWord.TelegramPictureID ?? null,
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
