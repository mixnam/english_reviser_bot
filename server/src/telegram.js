const dotenv = require('dotenv');
const TelegramBot = require('node-telegram-bot-api');
const {NotionDB} = require('./database.js');
const {ReviseCommand, ReviseCallbackId} = require('./commands/revise.js');
const {LearnCommand, LearnCallbackId} = require('./commands/learn.js');
const {TestDBCommand} = require('./commands/testDB.js');
const {getUserByChatID} = require('./repo/users.js');

/**
 * Bot
 */
class Bot {
  #bot;
  #notionDB;
  #reviseCommand;
  #learnCommand;
  #testDBCommand;

  /**
   * Bot constructor
   */
  constructor() {
    this.#bot = new TelegramBot(
        process.env.TELEGRAM_BOT_API_KEY,
    );
    this.#notionDB = new NotionDB(
        process.env.NOTION_SECRET,
        process.env.NOTION_DATABASE_ID,
    );
    this.#reviseCommand = new ReviseCommand(this.#bot, this.#notionDB);
    this.#learnCommand = new LearnCommand(this.#bot, this.#notionDB);
    this.#testDBCommand = new TestDBCommand(this.#bot);

    this.#setup();
  }

  #setup = () => {
    this.#bot.on('message', async (msg) => {
      // TODO remove accessChecker
      if (!this.#accessChecker(msg)) {
        this.#bot.sendMessage(
            msg.chat.id,
            'You are not my master, I am not your slave',
        );
        return;
      }

      const user = await getUserByChatID(msg.chat.id);
      if (user instanceof Error) {
        console.log(user);
        return;
      }

      switch (msg.text) {
        case '/ping':
          this.#bot.sendMessage(
              msg.chat.id,
              `Pong: ${new Date()}`,
          );
          return;
        case '/revise':
          this.#reviseCommand.processMsg(msg, user);
          return;
        case '/learn':
          this.#learnCommand.processMsg(msg, user);
          return;
        case '/testDB':
          this.#testDBCommand.processMsg(msg);
          return;
        default:
          this.#bot.sendMessage(
              msg.chat.id,
              'Have no idea what you want from me',
          );
      }
    });

    this.#bot.on('callback_query', async (query) => {
      const [callbakId, data] = this.#parseCallbackData(query.data);
      switch (callbakId) {
        case ReviseCallbackId:
          this.#reviseCommand.processCallback(query.message, data);
          return;
        case LearnCallbackId:
          this.#learnCommand.processCallback(query.message, data);
          return;
        default:
          console.error(`Can not understand callback_id ${callbakId}`);
      }
    });
  };

  /**
   * @param {TelegramBot.Message} msg
   * @return {boolean}
   */
  #accessChecker = (msg) => {
    if (msg.chat.username === process.env.TELEGRAM_MASTER_USER) {
      return true;
    }
    return false;
  };

  /**
   * @param {string} input
   * @return {[string, Array<any>] | Error}
   */
  #parseCallbackData = (input) => {
    const parsed = input.split(',');
    if (typeof parsed[0] === 'string') {
      return [parsed[0], parsed.slice(1)];
    }
    return new Error(`can't parse callback_data: ${input}`);
  };

  /**
   * @param {TelegramBot.Update} update
   */
  handleRequest = (update) => {
    this.#bot.processUpdate(update);
  };

  startPolling = () => {
    this.#bot.startPolling();
  };
}

module.exports = {
  Bot,
};

if (process.argv[2] === '--dev') {
  dotenv.config();
  const bot = new Bot();
  bot.startPolling();
}
