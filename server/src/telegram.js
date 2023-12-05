const dotenv = require('dotenv');
const TelegramBot = require('node-telegram-bot-api');
const {ReviseCommand, ReviseCallbackId} = require('./commands/revise.js');
const {LearnCommand, LearnCallbackId} = require('./commands/learn.js');
const {TestCommand} = require('./commands/test.js');
const {StartCommand} = require('./commands/start.js');
const {forceTransition} = require('./flows/processor/index.js');
const {AddCommand} = require('./commands/add.js');
const {renderHelpMsg} = require('./render/renderHelpMsg.js');
const {renderYouAreNotMyMaster} = require('./render/renderTextMsg.js');

/**
 * Bot
 */
class Bot {
  #bot;
  #reviseCommand;
  #learnCommand;
  #testCommand;
  #startCommand;
  #addCommand;

  /**
   * Bot constructor
   */
  constructor() {
    if (!process.env.TELEGRAM_BOT_API_KEY) {
      throw new Error('TELEGRAM_BOT_API_KEY is not specified');
    }
    this.#bot = new TelegramBot(
        process.env.TELEGRAM_BOT_API_KEY,
    );
    this.#reviseCommand = new ReviseCommand(this.#bot);
    this.#learnCommand = new LearnCommand(this.#bot);
    this.#startCommand = new StartCommand(this.#bot);
    this.#addCommand = new AddCommand(this.#bot);


    this.#testCommand = new TestCommand(this.#bot);

    this.#setup();
  }

  #setup = () => {
    this.#bot.on('message', async (msg) => {
      switch (msg.text) {
        case '/start':
          this.#startCommand.processMsg(msg);
          return;
        case '/help':
          this.#bot.sendMessage(
              msg.chat.id,
              renderHelpMsg(), {
                parse_mode: 'MarkdownV2',
              });
          return;
        case '/revise':
          this.#reviseCommand.processMsg(msg);
          return;
        case '/learn':
          this.#learnCommand.processMsg(msg);
          return;
        case '/add':
          this.#addCommand.processMsg(msg);
          return;
        case '/ping':
          this.#protectedCommand(msg, () => {
            this.#bot.sendMessage(
                msg.chat.id,
                `Pong: ${new Date()}`,
            );
          });
          return;
        case '/test':
          this.#protectedCommand(msg, this.#testCommand.processMsg);
          return;
        default:
          forceTransition(this.#bot, msg.chat.id, msg);
      }
    });

    this.#bot.on('callback_query', async (query) => {
      if (!query.data) {
        console.error('No data in callback_query');
        return;
      }
      if (!query.message) {
        console.error('No message in callback_query');
        return;
      }
      const callbackData = this.#parseCallbackData(query.data);
      if (callbackData instanceof Error) {
        console.error(callbackData);
        return;
      }
      const [callbakId, data] = callbackData;
      switch (callbakId) {
        case ReviseCallbackId:
          this.#reviseCommand.processCallback(query.message, data);
          return;
        case LearnCallbackId:
          this.#learnCommand.processCallback(query.message, data);
          return;
        default:
          // deadcode
          // enchancment add forceCallbackTransition
          forceTransition(this.#bot, query.message.chat.id, query.message);
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
   * @param {TelegramBot.Message} msg
   * @param {Function} fn
   */
  #protectedCommand = (msg, fn) => {
    if (!this.#accessChecker(msg)) {
      this.#bot.sendMessage(
          msg.chat.id,
          renderYouAreNotMyMaster(),
      );
      return;
    }
    fn(msg);
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
  dotenv.config({path: '.env.dev', debug: true});
  const bot = new Bot();
  bot.startPolling();
}
