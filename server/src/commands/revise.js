// eslint-disable-next-line
const TelegramBot = require('node-telegram-bot-api');
const {escapeMarkdown} = require('telegram-escape');
const {Command} = require('./command');
// eslint-disable-next-line
const {NotionDB, Property} = require('../database');
const {renderRichText} = require('../utils.js');

const ReviseCallbackId = '[REVISE]';

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
                callback_data: `${ReviseCallbackId},${page.id},true`},
              {
                text: 'Forgot ❌',
                callback_data: `${ReviseCallbackId},${page.id},false`,
              }],
            ],
          },
        });
  };

  /**
   * @param {TelegramBot.Message} msg
   * @param {Array<any>} rawData
   */
  async processCallback(msg, rawData) {
    const data = this.#parseCallbackData(rawData);
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
        message_id: msg.message_id,
        chat_id: msg.chat.id,
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
        message_id: msg.message_id,
        chat_id: msg.chat.id,
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
   * @param {Array<any>} rawData
   * @return {CallbackData|Error}
   */
  #parseCallbackData = (rawData) => {
    if (
      rawData.length === 2 &&
    typeof rawData[0] === 'string' &&
      (rawData[1] === 'true' || rawData[1] === 'false')
    ) {
      return {
        pageId: rawData[0],
        remember: rawData[1] === 'true',
      };
    }
    return new Error(`can't parse callback_data: ${input}`);
  };
}

module.exports = {
  ReviseCommand,
  ReviseCallbackId,
};
