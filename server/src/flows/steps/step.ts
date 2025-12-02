import TelegramBot from 'node-telegram-bot-api';
import {State, User} from '../../repo/users.js';
import {Logger} from 'pino';

abstract class Step {
  nextStepID: string | null;

  constructor(nextStepID: string | null) {
    this.nextStepID = nextStepID;
  }

  abstract makeTransition: (
      _msg: TelegramBot.Message,
      _user: User,
      _bot: TelegramBot,
      _logger: Logger,
  ) => Promise<[State | null, string]>;

  abstract makeAction: (
      _user: User,
      _logger: Logger,
  ) => Promise<[
       string,
       ((chatID: number | string) => TelegramBot.ReplyKeyboardMarkup | TelegramBot.InlineKeyboardMarkup) | null,
       Uint8Array | null,
       ((fileID: string) => Promise<null>) | null,
       string | null
    ]|Error>;
}

export {Step};
