// eslint-disable-next-line
const TelegramBot = require('node-telegram-bot-api');
const {escapeMarkdown} = require('telegram-escape');
const {Command} = require('./command');
// eslint-disable-next-line
const {NotionDB, Property} = require('../database');
const {renderRichText} = require('../utils.js');

const LearnCallbackId = '[LEARN]';

/**
 * ReviseCommand
 */
class LearnCommand extends Command {
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
    const page = await this.#notionDB.getRandomPageForLearn();
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
                text: 'UP',
                callback_data: [
                  LearnCallbackId,
                  page.id,
                  'true',
                ].join(','),
              },
              {
                text: 'DOWN',
                callback_data: [
                  LearnCallbackId,
                  page.id,
                  'false',
                ].join(','),
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

    console.log(data);
    if (data.remember) {
      const page = await this.#notionDB.getPageById(data.pageId);
      const res = await this.#notionDB.markPageProgress(
          data.pageId,
          page.properties[Property.Progress].select.name,
          'up',
      );
      if (res !== null) {
        console.error(res);
        return;
      }
      const english = escapeMarkdown(
          renderRichText(page.properties[Property.English]),
      );
      const translation = escapeMarkdown(
          renderRichText(page.properties[Property.Translation]),
      );
      this.#bot.editMessageText(`
*English:*
${english} \\- *UP*

*Translation:*
||${translation}||
    `, {
        parse_mode: 'MarkdownV2',
        message_id: msg.message_id,
        chat_id: msg.chat.id,
      });
    } else {
      const page = await this.#notionDB.getPageById(data.pageId);
      const res = await this.#notionDB.markPageProgress(
          data.pageId,
          page.properties[Property.Progress].select.name,
          'down',
      );
      if (res !== null) {
        console.error(res);
        return;
      }
      const english = escapeMarkdown(
          renderRichText(page.properties[Property.English]),
      );
      const translation = escapeMarkdown(
          renderRichText(page.properties[Property.Translation]),
      );
      this.#bot.editMessageText(`
*English:*
${english} \\- *DOWN*

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
  LearnCommand,
  LearnCallbackId,
};
