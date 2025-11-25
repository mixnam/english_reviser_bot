// eslint-disable-next-line
const TelegramBot = require('node-telegram-bot-api');

/**
 * @typedef LogFn
 * @type {{
 *  (ctx: Object, msg: string) : void;
 *  (ctx: Object, error: Error) : void;
 *  (msg: string) : void
 *  (error: Error) : void
 * }}
 */

/**
 * @typedef Logger
 * @type {Object}
 * @property {LogFn} info
 * @property {LogFn} debug
 * @property {LogFn} error
 * @property {(props: Object) => Logger} child
 */

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
   * @param {Logger} logger
   * @return {Promise<[
   *    import('../../repo/users').State | null,
   *    string
   * ]>}
   */
  makeTransition = async (msg, user, bot, logger) => {
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
   * @param {Logger} logger
   * @returns {Promise<[
   *    string,
   *    (chatID: number | string) => TelegramBot.ReplyKeyboardMarkup | TelegramBot.InlineKeyboardMarkup | null,
   *    Uint8Array | null,
   *    onFileUploaded | null,
   *    string | null
   * ]|Error>}
   */
  makeAction = async (user, logger) => {
    throw new Error('makeAction is not implemented');
  };
}

module.exports = {
  Step,
};
