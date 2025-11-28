// eslint-disable-next-line
import TelegramBot from 'node-telegram-bot-api';

import {
  addNewUser,
} from '../repo/users.js';
import {Command} from './command.js';
import {
  renderStartError,
  renderStartSuccess,
} from '../render/renderStartMsg.js';

/**
 * StartCommand
 */
class StartCommand extends Command {
  #bot;

  /**
   * StartCommand constructor
   * @param {TelegramBot} bot
   * @param {import('./command.js').Logger} logger
   */
  constructor(bot, logger) {
    super(logger.child({command: 'StartCommand'}));
    this.#bot = bot;
  }

  /**
   * @type {Command['processMsg']}
   */
  async processMsg(msg) {
    const ctx = {chatID: msg.chat.id};
    const newUserID = await addNewUser({
      chatID: msg.chat.id,
      username: msg.chat.username,
      firstName: msg.chat.first_name,
      lastName: msg.chat.last_name,
      state: null,
      flowID: null,
      stepID: null,
    }, this.logger.child(ctx));

    if (newUserID instanceof Error) {
      this.logger.error(ctx, newUserID);
      this.#bot.sendMessage(msg.chat.id, renderStartError());
      return;
    }

    this.#bot.sendMessage(msg.chat.id, renderStartSuccess());
  };
}

export {
  StartCommand,
};
