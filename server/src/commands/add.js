// eslint-disable-next-line
import TelegramBot from 'node-telegram-bot-api';

import {Command} from './command.js';
import {setUserStepID} from '../repo/users.js';
import {StepID as AddNewWordStepID} from '../flows/steps/addNewWordStep.js';
import {forceAction} from '../flows/processor/index.js';


/**
 * AddCommand
 */
class AddCommand extends Command {
  #bot;

  /**
   * AddCommand constructor
   * @param {TelegramBot} bot
   * @param {import('./command.js').Logger} logger
   */
  constructor(bot, logger) {
    super(logger.child({command: 'AddCommand'}));
    this.#bot = bot;
  }

  /**
   * @type {Command['processMsg']}
   */
  processMsg = async (msg) => {
    const ctx = {chatID: msg.chat.id};
    const user = await this.getSessionUser(msg);
    if (user instanceof Error) {
      this.logger.error(ctx, user);
      return;
    }
    ctx.userID = user._id;

    const result = await setUserStepID(user._id, AddNewWordStepID, this.logger.child(ctx));
    if (result !== null) {
      this.logger.error(ctx, result);
      return;
    }
    user.stepID = AddNewWordStepID;
    return forceAction(this.#bot, user, this.logger.child(ctx));
  };
}

export {
  AddCommand,
};
