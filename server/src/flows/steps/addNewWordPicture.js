const {setWordPictureName} = require('../../repo/words');
const {renderSendMePictureForThisWord} = require('../../render/renderTextMsg');
const {uploadPicture} = require('../../repo/files');
const {Step} = require('./step');

const StepID = 'ADD_NEW_WORD_PICTURE';

/**
 * AddNewWordPicture
 */
class AddNewWordPicture extends Step {
  /**
   * @type {Step['makeAction']}
   */
  makeAction = async () => {
    return [
      renderSendMePictureForThisWord(),
      null,
      null,
      null,
      null,
    ];
  };

  /**
   * @type {Step['makeTransition']}
   */
  makeTransition = async (msg, user, bot) => {
    const {newWord} = user.state;
    if (!newWord) {
      // TODO throw Error
      return [null, StepID];
    }
    if (!msg.photo) {
      console.error('User didn\'t send no photo');
      return [null, StepID];
    }
    /**
     * Choosing largest image with limit size up to 50Kb
     */
    const picture = msg.photo.reduce(
        (res, photo) =>
            photo.file_size > res.file_size &&
            photo.file_size < 50000 ?
                photo :
                res,
    );


    try {
      uploadPicture(
          bot.getFileStream(picture.file_id),
      );
    } catch (err) {
      console.error(err);
      return [null, StepID];
    }

    newWord.TelegramPictureID = picture.file_id;

    return [user.state, this.nextStepID];
  };
}

module.exports = {
  AddNewWordPicture,
  StepID,
};
