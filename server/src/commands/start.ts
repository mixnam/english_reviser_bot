import TelegramBot from 'node-telegram-bot-api';

import {
  addNewUser,
} from '../repo/users.js';
import {Command} from './command.js';
import {
  renderStartError,
  renderStartSuccess,
} from '../render/renderStartMsg.js';
import {Logger} from 'pino';
import {User} from '../repo/users.js';

class StartCommand extends Command {
  private bot: TelegramBot;

  constructor(bot: TelegramBot, logger: Logger) {
    super(logger.child({command: 'StartCommand'}));
    this.bot = bot;
  }

  processMsg = async (msg: TelegramBot.Message): Promise<null> => {
    const ctx = {chatID: msg.chat.id};
    const newUser: Omit<User, '_id'> = {
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
      this.logger.error({...ctx, err: newUserID}, 'addNewUser error');
      this.bot.sendMessage(msg.chat.id, renderStartError());
      return null;
    }

    this.bot.sendMessage(msg.chat.id, renderStartSuccess());
    return null;
  };
}

export {
  StartCommand,
};
