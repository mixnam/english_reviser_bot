import TelegramBot from 'node-telegram-bot-api';
import {Logger as PinoLogger} from 'pino';

import {addNewUser, getUserByChatID, User} from '../repo/users.js';

export type Logger = PinoLogger;

/**
 * Basic interface for bot command
 */
class Command {
  protected logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  getSessionUser = async (msg: TelegramBot.Message): Promise<User | Error> => {
    const ctx = {chatID: msg.chat.id};
    const user = await getUserByChatID(msg.chat.id, this.logger.child(ctx));
    if (user instanceof Error) {
      return user;
    }
    if (user === null) {
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
        return newUserID;
      }
      return {
        _id: newUserID,
        ...newUser,
      };
    }
    return user;
  };

  async processMsg(msg: TelegramBot.Message, _wordCount?: number): Promise<null> {
    throw new Error(`processMsg method is not implemented - ${msg}`);
  };

  async processCallback(msg: TelegramBot.Message, _rawData: unknown[]): Promise<null> {
    throw new Error(
        `processCallback method is not implemented - ${msg}`,
    );
  };
}

export {Command};
