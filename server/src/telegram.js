import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import {NotionDB, Property} from './database.js';
import {renderRichText} from './utils.js';

/**
 * Bot
 */
export class Bot {
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

      const page = await this.#notionDB.getRandomPageForRevise();

      this.#bot.sendMessage(
          msg.chat.id,
          renderRichText(page.properties[Property.English]),
          {
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
        this.#bot.editMessageText(`
    ${renderRichText(page.properties[Property.English])} - <b>Revised ✅</b>

<b>Translation:</b>
${renderRichText(page.properties[Property.Translation])}
    `, {
          parse_mode: 'HTML',
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
        this.#bot.editMessageText(`
    ${renderRichText(page.properties[Property.English])} - <b>Forgot ❌</b>

<b>Translation:</b>
${renderRichText(page.properties[Property.Translation])}
    `, {
          parse_mode: 'HTML',
          message_id: query.message.message_id,
          chat_id: query.message.chat.id,
        });
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
        remember: Boolean(parsed[1]),
      };
    }
    return new Error(`can't parse callback_data: ${input}`);
  };

  /**
   * @param {TelegramBot.Update} req
   */
  handleRequest = (req) => {
    this.#bot.processUpdate(req);
  };

  startPolling = () => {
    this.#bot.startPolling();
  };
}

if (process.argv[2] === '--dev') {
  dotenv.config();
  const bot = new Bot();
  bot.startPolling();
}
