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
   * @param {TelegramBot} bot - DO NOT INJECT BOT LIKE THIS
   * @return {Promise<[
   *    import('../../repo/users').State | null,
   *    string
   * ]>}
   */
  makeTransition = async (msg, user, bot) => {
    throw new Error('makeTransition is not implemented');
  };

  /**
   * @callback onFileUploaded
   * @param {string} fileID
   *
   * @returns {Promise<null>}
   */

  /**
   * @param {import("../../repo/users").User} user
   * @returns {Promise<[
   *    string,
   *    TelegramBot.ReplyKeyboardMarkup | null,
   *    Uint8Array | null,
   *    onFileUploaded | null,
   *    string | null
   * ]|Error>}
   */
  makeAction = async (user) => {
    throw new Error('makeAction is not implemented');
  };
}

module.exports = {
  Step,
};
