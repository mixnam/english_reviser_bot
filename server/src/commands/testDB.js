// eslint-disable-next-line
const TelegramBot = require('node-telegram-bot-api');
const {Command} = require('./command');
const {getClient} = require('../repo/repo');
const {addNewUser} = require('../repo/users');


/**
 * TextDBCommand
 */
class TestDBCommand extends Command {
  #bot;

  /**
   * ReviseCommand constructor
   * @param {TelegramBot} bot
   */
  constructor(bot) {
    super();
    this.#bot = bot;
  }

  /**
   * @param {TelegramBot.Message} msg
   */
  async processMsg(msg) {
    const result = await addNewUser({
      chatID: msg.chat.id,
      firstName: msg.chat.first_name,
      lastName: msg.chat.last_name,
      username: msg.chat.username,
      flowID: null,
      stepID: null,
      state: null,
    });

    if (result instanceof Error) {
      console.log(result);
      this.#bot.sendMessage(msg.chat.id, `Oops, smth went wrong ${result}`);
      return;
    }
    this.#bot.sendMessage(msg.chat.id, `User created with ID ${result}`);
  };
}

module.exports = {
  TestDBCommand,
};
