import TelegramBot from 'node-telegram-bot-api';
import {Logger} from 'pino';
import {getUserByChatID, User} from '../repo/users.js';

/**
 * Basic interface for bot web app command
 */
abstract class WebAppCommand<M> {
  protected logger: Logger;
  protected bot: TelegramBot;

  constructor(bot: TelegramBot, logger: Logger) {
    this.bot = bot;
    this.logger = logger;
  }

  getSessionUser = async (chatID: number): Promise<User | Error> => {
    const ctx = {chatID: chatID};
    const user = await getUserByChatID(chatID, this.logger.child(ctx));
    if (user instanceof Error) {
      return user;
    }
    return user;
  };

  async processMsg(msg: M): Promise<Error | null | void> {
    throw new Error(`processMsg method is not implemented - ${JSON.stringify(msg)}`);
  };
}

export {WebAppCommand};

