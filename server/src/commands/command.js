// eslint-disable-next-line
import TelegramBot from 'node-telegram-bot-api';

import {addNewUser, getUserByChatID} from '../repo/users.js';

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
 * Basic interface for bot command
 */
class Command {
  /**
   * @type {Logger}
   */
  logger;

  /**
     * @param {Logger} logger
     */
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * @param {TelegramBot.Message} msg
   * @return {Promise<import('../repo/users.js').User|Error>}
   */
  getSessionUser = async (msg) => {
    const ctx = {chatID: msg.chat.id};
    const user = await getUserByChatID(msg.chat.id, this.logger.child(ctx));
    if (user instanceof Error) {
      return user;
    }
    if (user === null) {
      /**
       * @type {Omit<import('../repo/users.js').User, '_id'>}
       */
      const newUser = {
        chatID: msg.chat.id,
        username: msg.chat.username,
        firstName: msg.chat.first_name,
        lastName: msg.chat.last_name,
        state: null,
        flowID: null,
        stepID: null,
      };
      const newUserID = await addNewUser(newUser, this.logger.child(ctx));
      if (newUserID instanceof Error) {
        return newUserID;
      }
      return {
        _id: newUserID,
        ...newUser,
      };
    }
    return user;
  };

  /**
   * @param {TelegramBot.Message} msg
   * @param {number} [wordCount]
   *
   * @returns {Promise<null>}
   */
  async processMsg(msg, wordCount) {
    throw new Error(`processMsg method is not implemented - ${msg}`);
  };

  /**
   * @param {TelegramBot.Message} msg
   * @param {Array<any>} rawData
   *
   * @returns {Promise<null>}
   */
  async processCallback(msg, rawData) {
    throw new Error(
        `processCallback method is not implemented - ${msg}`,
    );
  };
}

export {Command};
