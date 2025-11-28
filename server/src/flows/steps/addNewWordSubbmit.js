import {Step} from './step.js';
import {addNewWord, setWordTelegramAudioID} from '../../repo/words.js';
import {TTSService} from '../../tts/openaiTts.js';
import {renderYouJustAddedNewWord} from '../../render/renderTextMsg.js';

const StepID = 'ADD_NEW_WORD_SUBBMIT';

/**
 * AddNewWordSubbmit
 */
class AddNewWordSubbmit extends Step {
  /**
   * @type {Step['makeAction']}
   */
  makeAction = async (user, logger) => {
    const newWord = /** @type {import('../../repo/words.js').Word} */ (user.state.newWord);
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

export {
  AddNewWordSubbmit,
  StepID,
};
