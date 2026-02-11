import {Step} from './step.js';
import {addNewWord, setWordTelegramAudioID, Word} from '../../repo/words.js';
import * as TTSService from '../../tts/openaiTts.js';
import {renderYouJustAddedNewWord} from '../../render/renderTextMsg.js';
import * as GoogleCloudStorage from '../../services/googleCloudStorage.js';

const StepID = 'ADD_NEW_WORD_SUBBMIT';

class AddNewWordSubbmit extends Step {
  override makeAction = async (...params: Parameters<Step['makeAction']>): ReturnType<Step['makeAction']> => {
    const [user, logger] = params;

    if (!user.state || !user.state.newWord) {
      return new Error('impossible state, no newWord');
    }
    const newWord = user.state.newWord as Word;

    const ttsText = newWord.Examples?.trim().length > 0 ?
      newWord.Examples :
      newWord.English;

    const audio = await TTSService.getInstance().getAudioForText(ttsText);
    if (audio instanceof Error) {
      return audio;
    } else {
      try {
        const audioURL = await GoogleCloudStorage.getInstance().uploadAudio(
            audio,
            `${newWord._id}.ogg`,
            logger,
        );
        newWord.AudioURL = audioURL;
      } catch (err) {
        logger.error({err}, 'Failed to upload audio to GCS');
      }
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

  override makeTransition = async (): ReturnType<Step['makeTransition']> => {
    return [null, this.nextStepID];
  };
}

export {
  AddNewWordSubbmit,
  StepID,
};
