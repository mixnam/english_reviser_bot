import {renderSendMePictureForThisWord} from '../../render/renderTextMsg.js';
import {Word} from '../../repo/words.js';
import {Step} from './step.js';
import * as GoogleCloudStorage from '../../services/googleCloudStorage.js';

const StepID = 'ADD_NEW_WORD_PICTURE';

const IMAGE_FILE_SIZE = 1_000_000; // size in KB

/**
 * AddNewWordPicture
 */
class AddNewWordPicture extends Step {
  override makeAction = async (): ReturnType<Step['makeAction']> => {
    return [
      renderSendMePictureForThisWord(),
      null,
      null,
      null,
      null,
    ];
  };

  override makeTransition = async (...params: Parameters<Step['makeTransition']>): ReturnType<Step['makeTransition']> => {
    const [msg, user, bot, logger] = params;
    if (!user.state || !user.state.newWord) {
      // TODO throw Error
      return [user.state, StepID];
    }
    const newWord = user.state.newWord as Word;
    if (!msg.photo) {
      logger.error({msg}, 'User didn\'t send no photo');
      return [user.state, StepID];
    }
    /**
     * Choosing largest image with limit size up to 50Kb
     */
    const picture = msg.photo.reduce(
        (res, photo) =>
            photo.file_size! > res.file_size! &&
            photo.file_size! < IMAGE_FILE_SIZE ?
                photo :
                res,
    );


    try {
      const imageURL = await GoogleCloudStorage.getInstance().uploadImage(
          bot.getFileStream(picture.file_id),
          newWord._id,
          logger,
      );
      newWord.ImageURL = imageURL;
    } catch (err) {
      logger.error({err}, 'uploadPicture error');
      return [user.state, StepID];
    }

    newWord.TelegramPictureID = picture.file_id;

    return [user.state, this.nextStepID];
  };
}

export {
  AddNewWordPicture,
  StepID,
};
