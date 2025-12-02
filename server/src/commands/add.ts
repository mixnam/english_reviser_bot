import TelegramBot from 'node-telegram-bot-api';
import {Logger} from 'pino';

import {Command} from './command.js';
import {setUserStepID} from '../repo/users.js';
import {StepID as AddNewWordStepID} from '../flows/steps/addNewWordStep.js';
import {forceAction} from '../flows/processor/index.js';

class AddCommand extends Command {
  private bot: TelegramBot;

  constructor(bot: TelegramBot, logger: Logger) {
    super(logger.child({command: 'AddCommand'}));
    this.bot = bot;
  }

  processMsg = async (msg: TelegramBot.Message): Promise<null> => {
    const ctx: {chatID: number; userID?: string} = {chatID: msg.chat.id};
    const user = await this.getSessionUser(msg);
    if (user instanceof Error) {
      this.logger.error({...ctx, err: user}, 'User error');
      return null;
    }
    ctx.userID = user._id;

    const result = await setUserStepID(user._id, AddNewWordStepID, this.logger.child(ctx));
    if (result !== null) {
      this.logger.error({...ctx, err: result}, 'Step update error');
      return null;
    }
    user.stepID = AddNewWordStepID;
    await forceAction(this.bot, user, this.logger.child(ctx));
    return null;
  };
}

export {
  AddCommand,
};
