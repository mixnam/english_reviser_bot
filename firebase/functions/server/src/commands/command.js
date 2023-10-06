// eslint-disable-next-line
const TelegramBot = require('node-telegram-bot-api');

/**
 * Basic interface for bot command
 */
class Command {
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
