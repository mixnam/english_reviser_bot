// eslint-disable-next-line
import TelegramBot from 'node-telegram-bot-api';

/**
 * @typedef {import('pino').Logger} Logger
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
   * @param {import("../../repo/users.js").User} user
   * @param {TelegramBot} bot - DO NOT INJECT BOT LIKE THIS
   * @param {Logger} logger
   * @return {Promise<[
   *    import('../../repo/users.js').State | null,
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
   * @param {import("../../repo/users.js").User} user
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

export {Step};
