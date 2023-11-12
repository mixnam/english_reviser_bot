// eslint-disable-next-line
const TelegramBot = require('node-telegram-bot-api');
const {Command} = require('./command');
const {getUserByChatID, setUserStepID} = require('../repo/users');
const AddNewWord = require('../flows/steps/addNewWordStep');
const {forceAction} = require('../flows/processor');
const {getSpelcheckSuggestions} = require('../repo/words');


/**
 * TextDBCommand
 */
class TestDBCommand extends Command {
  #bot;

  /**
   * ReviseCommand constructor
   * @param {TelegramBot} bot
   */
  constructor(bot) {
    super();
    this.#bot = bot;
  }

  /**
   * @param {TelegramBot.Message} msg
   */
  processMsg = async (msg) => {
    const user = await this.getSessionUser(msg);
    if (user instanceof Error) {
      console.log(user);
      return;
    }

    const words = await getSpelcheckSuggestions('test', user._id);
    console.log(words);
  };
}

module.exports = {
  TestDBCommand,
};
