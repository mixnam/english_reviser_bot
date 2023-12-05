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
   */
  constructor(bot) {
    super();
    this.#bot = bot;
  }

  /**
   * @type {Command['processMsg']}
   */
  processMsg = async (msg) => {
    const user = await this.getSessionUser(msg);
    if (user instanceof Error) {
      console.error(user);
      return;
    }

    const result = await setUserStepID(user._id, AddNewWord.StepID);
    if (result !== null) {
      console.error(result);
      return;
    }
    user.stepID = AddNewWord.StepID;
    forceAction(this.#bot, user);
  };
}

module.exports = {
  AddCommand,
};
