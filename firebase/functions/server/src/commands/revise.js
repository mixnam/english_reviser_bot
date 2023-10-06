// eslint-disable-next-line
const TelegramBot = require('node-telegram-bot-api');
const {escapeMarkdown} = require('telegram-escape');
const {Command} = require('./command');
// eslint-disable-next-line
const {NotionDB, Property} = require('../database');
const {renderRichText} = require('../utils.js');

/**
 * ReviseCommand
 */
class ReviseCommand extends Command {
  #bot;
  #notionDB;

  /**
   * ReviseCommand constructor
   * @param {TelegramBot} bot
   * @param {NotionDB} notionDB
   */
  constructor(bot, notionDB) {
    super();
    this.#bot = bot;
    this.#notionDB = notionDB;
  }

  /**
   * @param {TelegramBot.Message} msg
   */
  async processMsg(msg) {
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
   * @param {TelegramBot.CallbackQuery} query
   */
  async processCallback(query) {
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
}

module.exports = {
  ReviseCommand,
};
