import {renderSendMePictureForThisWord} from '../../render/renderTextMsg.js';
import {uploadPicture} from '../../repo/files.js';
import {Step} from './step.js';
import {Word} from '../../repo/words.js';

const StepID = 'ADD_NEW_WORD_PICTURE';

/**
 * AddNewWordPicture
 */
class AddNewWordPicture extends Step {
  override async makeAction(): ReturnType<Step['makeAction']> {
    return [
      renderSendMePictureForThisWord(),
      null,
      null,
      null,
      null,
    ];
  };

  override async makeTransition(...params: Parameters<Step['makeTransition']>): ReturnType<Step['makeTransition']> {
    const [msg, user, bot, logger] = params;
    const newWord = user.state.newWord as Word;
    if (!newWord) {
      // TODO throw Error
      return [user.state, StepID];
    }
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
            photo.file_size! < 50000 ?
                photo :
                res,
    );


    try {
      const fileName = await uploadPicture(
          bot.getFileStream(picture.file_id),
          logger,
      );
      newWord.PictureFileName = fileName;
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
