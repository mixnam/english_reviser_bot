// eslint-disable-next-line
const TelegramBot = require('node-telegram-bot-api');
const {addNewUser, getUserByChatID} = require('../repo/users');

/**
 * Basic interface for bot command
 */
class Command {
  /**
   * @param {TelegramBot.Message} msg
   * @return {Promise<import('../repo/users').User|Error>}
   */
  getSessionUser = async (msg) => {
    const user = await getUserByChatID(msg.chat.id);
    if (user instanceof Error) {
      return user;
    }
    if (user === null) {
      /**
       * @type {Omit<import('../repo/users').User, '_id'>}
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
      const newUserID = await addNewUser(newUser);
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
   */
  async processMsg(msg, wordCount) {
    throw new Error(`processMsg method is not implemented - ${msg}`);
  };

  /**
   * @param {TelegramBot.Message} msg
   * @param {Array<any>} rawData
   */
  async processCallback(msg, rawData) {
    throw new Error(
        `processCallback method is not implemented - ${msg}`,
    );
  };
}

module.exports = {
  Command,
};
