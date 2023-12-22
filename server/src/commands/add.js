// eslint-disable-next-line
const TelegramBot = require('node-telegram-bot-api');
const {Command} = require('./command');
const {setUserStepID} = require('../repo/users');
const AddNewWord = require('../flows/steps/addNewWordStep');
const {forceAction} = require('../flows/processor');


/**
 * AddCommand
 */
class AddCommand extends Command {
  #bot;

  /**
   * AddCommand constructor
   * @param {TelegramBot} bot
   * @param {import('./command').Logger} logger
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

    const result = await setUserStepID(user._id, AddNewWord.StepID, this.logger.child(ctx));
    if (result !== null) {
      this.logger.error(ctx, result);
      return;
    }
    user.stepID = AddNewWord.StepID;
    return forceAction(this.#bot, user, this.logger.child(ctx));
  };
}

module.exports = {
  AddCommand,
};
