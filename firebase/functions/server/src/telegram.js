const dotenv = require('dotenv');
const TelegramBot = require('node-telegram-bot-api');
const {escapeMarkdown} = require('telegram-escape');
const {NotionDB, Property} = require('./database.js');
const {renderRichText} = require('./utils.js');

/**
 * Bot
 */
class Bot {
  #bot;
  #notionDB;

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

    this.#setup();
  }

  #setup = () => {
    this.#bot.on('message', async (msg) => {
      if (!this.#accessChecker(msg)) {
        this.#bot.sendMessage(
            msg.chat.id,
            'You are not my master, I am not your slave',
        );
        return;
      }
      this.#nextWord(msg);
    });

    this.#bot.on('callback_query', async (query) => {
      const data = this.#parseCallbackData(query.data);
      if (data instanceof Error) {
        console.error(data);
        return;
      }

      if (data.remember) {
        const res = await this.#notionDB.markPageAsRevised(data.pageId);
        if (res !== null) {
          console.error(res);
          return;
        }
        const page = await this.#notionDB.getPageById(data.pageId);
        const english = escapeMarkdown(
            renderRichText(page.properties[Property.English]),
        );
        const translation = escapeMarkdown(
            renderRichText(page.properties[Property.Translation]),
        );
        this.#bot.editMessageText(`
*English:*
${english} \\- *Revised ✅*

*Translation:*
||${translation}||
    `, {
          parse_mode: 'MarkdownV2',
          message_id: query.message.message_id,
          chat_id: query.message.chat.id,
        });
      } else {
        const res = await this.#notionDB.markPageAsForgotten(data.pageId);
        if (res !== null) {
          console.error(res);
          return;
        }
        const page = await this.#notionDB.getPageById(data.pageId);
        const english = escapeMarkdown(
            renderRichText(page.properties[Property.English]),
        );
        const translation = escapeMarkdown(
            renderRichText(page.properties[Property.Translation]),
        );
        this.#bot.editMessageText(`
*English:*
${english} \\- *Forgot ❌*

*Translation:*
||${translation}||
    `, {
          parse_mode: 'MarkdownV2',
          message_id: query.message.message_id,
          chat_id: query.message.chat.id,
        });
      }
      this.#nextWord(query.message);
    });
  };

  /**
   * @param {TelegramBot.Message} msg
   */
  #nextWord = async (msg) => {
    const page = await this.#notionDB.getRandomPageForRevise();
    const english = escapeMarkdown(
        renderRichText(page.properties[Property.English]),
    );
    const translation = escapeMarkdown(
        renderRichText(page.properties[Property.Translation]),
    );

    this.#bot.sendMessage(
        msg.chat.id,
        `
*English:*
${english}

*Translation:*
||${translation}||
          `,
        {
          parse_mode: 'MarkdownV2',
          reply_markup: {
            inline_keyboard: [
              [{
                text: 'Remember ✅',
                callback_data: `${page.id} true`},
              {
                text: 'Forgot ❌',
                callback_data: `${page.id} false`,
              }],
            ],
          },
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
   * @typedef CallbackData
   * @type {object}
   * @property {string} pageId
   * @property {boolean} remember
   */

  /**
   * @param {string} input
   * @return {CallbackData|Error}
   */
  #parseCallbackData = (input) => {
    const parsed = input.split(' ');
    if (
      parsed.length === 2 &&
    typeof parsed[0] === 'string' &&
      (parsed[1] === 'true' || parsed[1] === 'false')
    ) {
      return {
        pageId: parsed[0],
        remember: parsed[1] === 'true',
      };
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
