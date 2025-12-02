import {getUserByChatID} from '../repo/users.js';

/**
 * @typedef {import('pino').Logger} Logger
 */


/**
 * Basic interface for bot web app command
 *
 * @template M
 * @abstract
 */
class WebAppCommand {
  /**
   * @type {Logger}
   */
  logger;
  bot;

  /**
   * @param {import('node-telegram-bot-api')} bot
   * @param {Logger} logger
   */
  constructor(bot, logger) {
    this.bot = bot;
    this.logger = logger;
  }


  /**
   * @param {number} chatID
   *
   * @return {Promise<import('../repo/users.js').User|Error>}
   */
  getSessionUser = async (chatID) => {
    const ctx = {chatID: chatID};
    const user = await getUserByChatID(chatID, this.logger.child(ctx));
    if (user instanceof Error) {
      return user;
    }
    return user;
  };

  /**
   * @param {M} msg
   *
   * @returns {Promise<Error|null>}
   */
  async processMsg(msg) {
    throw new Error(`processMsg method is not implemented - ${msg}`);
  };
}

export {WebAppCommand};
