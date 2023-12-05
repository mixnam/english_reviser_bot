// eslint-disable-next-line
const TelegramBot = require('node-telegram-bot-api');

/**
 * Step
 */
class Step {
  nextStepID;

  /**
   * @param {string} nextStepID
   */
  constructor(nextStepID) {
    this.nextStepID = nextStepID;
  }

  /**
   * @param {TelegramBot.Message} msg
   * @param {import("../../repo/users").User} user
   * @return {Promise<[
   *    import('../../repo/users').State | null,
   *    string
   * ]>}
   */
  makeTransition = async (msg, user) => {
    throw new Error('makeTransition is not implemented');
  };

  /**
   * @callback onFileUploaded
   * @param {string} fileID
   */

  /**
   * @param {import("../../repo/users").User} user
   * @returns {Promise<[
   *    string,
   *    TelegramBot.ReplyKeyboardMarkup | null,
   *    Uint8Array | null,
   *    onFileUploaded | null
   * ]|Error>}
   */
  makeAction = async (user) => {
    throw new Error('makeAction is not implemented');
  };
}

module.exports = {
  Step,
};
