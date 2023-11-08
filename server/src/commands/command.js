// eslint-disable-next-line
const TelegramBot = require('node-telegram-bot-api');
const {addNewUser, getUserByChatID} = require('../repo/users');

/**
 * Basic interface for bot command
 */
class Command {
  // eslint-disable-next-line
  /**
   * @param {TelegramBot.Message} msg
   * @return {Promise<import('../repo/users').User|Error>}
   */
  getSessionUser = async (msg) => {
    let user = await getUserByChatID(msg.chat.id);
    if (user instanceof Error) {
      return user;
    }
    if (user === null) {
      user = {
        chatID: msg.chat.id,
        username: msg.chat.username,
        firstName: msg.chat.first_name,
        lastName: msg.chat.last_name,
        state: null,
        flowID: null,
        stepID: null,
      };
      const newUserID = await addNewUser(user);
      if (newUserID instanceof Error) {
        return newUserID;
      }
      user._id = result;
    }
    return user;
  };
  /**
   * @param {TelegramBot.Message} msg
   */
  async processMsg(msg) {
    throw new Error(`processMsg method is not implemented - ${msg}`);
  };

  /**
   * @param {TelegramBot.CallbackQuery} query
   */
  async processCallback(query) {
    throw new Error(
        `processCallback method is not implemented - ${query}`,
    );
  };
}

module.exports = {
  Command,
};
