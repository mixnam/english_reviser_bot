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
   * @type {Object.<string, () => void>}
   */
  #updateResolverMap;


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

    this.#updateResolverMap = {};

    this.#setup();
  }

  #setup = () => {
    this.#bot.on('message', async (msg) => {
      switch (msg.text) {
        case '/start':
          await this.#startCommand.processMsg(msg);
          break;
        case '/help':
          await this.#bot.sendMessage(
              msg.chat.id,
              renderHelpMsg(), {
                parse_mode: 'MarkdownV2',
              });
          break;
        case '/revise':
          await this.#reviseCommand.processMsg(msg);
          break;
        case '/learn':
          await this.#learnCommand.processMsg(msg);
          break;
        case '/add':
          await this.#addCommand.processMsg(msg);
          break;
        case '/ping':
          await this.#protectedCommand(msg, async () => {
            return this.#bot.sendMessage(
                msg.chat.id,
                `Pong: ${new Date()}`,
            );
          });
          break;
        case '/test':
          await this.#protectedCommand(msg, this.#testCommand.processMsg);
          break;
        default:
          await forceTransition(this.#bot, msg.chat.id, msg);
      }

      const msgResolver = this.#updateResolverMap[msg.message_id];
      delete this.#updateResolverMap[msg.message_id];
      msgResolver?.();
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
          await this.#reviseCommand.processCallback(query.message, data);
          break;
        case LearnCallbackId:
          await this.#learnCommand.processCallback(query.message, data);
          break;
        default:
          // deadcode
          // enchancment add forceCallbackTransition
          forceTransition(this.#bot, query.message.chat.id, query.message);
      }

      const msgResolver = this.#updateResolverMap[query.id];
      delete this.#updateResolverMap[query.id];
      msgResolver?.();
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
   * @template {Function} T
   * @param {TelegramBot.Message} msg
   * @param {T} fn
   * @returns {Promise<any>}
   */
  #protectedCommand = async (msg, fn) => {
    if (!this.#accessChecker(msg)) {
      return this.#bot.sendMessage(
          msg.chat.id,
          renderYouAreNotMyMaster(),
      );
    }
    return fn(msg);
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
   *
   * @returns {Promise<null>}
   */
  handleRequest = (update) => {
    const id = update.message?.message_id ?? update.callback_query?.id;
    let resolve;
    const status = new Promise((res) => {
      resolve = res;
    });
    this.#updateResolverMap[id] = resolve;

    this.#bot.processUpdate(update);

    return status;
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
