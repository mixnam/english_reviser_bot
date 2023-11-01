// eslint-disable-next-line
const TelegramBot = require('node-telegram-bot-api');
const {
  getUserByChatID,
  addNewUser,
  NoUserWithChatIDError,
} = require('../repo/users');
const {Command} = require('./command');
const {
  renderStartError,
  renderStartSuccess,
  renderStartUserAlreadyExists,
} = require('../render/renderStartMsg');

/**
 * StartCommand
 */
class StartCommand extends Command {
  #bot;

  /**
   * StartCommand constructor
   * @param {TelegramBot} bot
   */
  constructor(bot) {
    super();
    this.#bot = bot;
  }

  // eslint-disable-next-line
  /**
   * @param {TelegramBot.Message} msg
   * @param {import('../repo/users').User} user
   */
  async processMsg(msg) {
    const newUserID = await addNewUser({
      chatID: msg.chat.id,
      username: msg.chat.username,
      firstName: msg.chat.first_name,
      lastName: msg.chat.last_name,
      state: null,
      flowID: null,
      stepID: null,
    });

    if (newUserID instanceof Error) {
      console.error(newUserID);
      this.#bot.sendMessage(msg.chat.id, renderStartError());
      return;
    }

    this.#bot.sendMessage(msg.chat.id, renderStartSuccess());
  };
}

module.exports = {
  StartCommand,
};
