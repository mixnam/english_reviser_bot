// eslint-disable-next-line
const TelegramBot = require('node-telegram-bot-api');
const {escapeMarkdown} = require('telegram-escape');
const {Command} = require('./command');
const {
  getRandomWordByUserIDForRevise,
  setWordAsRevisedByWordID,
  getWordByID,
  setWordAsForgottenByWordID,
} = require('../repo/words');

const ReviseCallbackId = '[REVISE]';
const QuestionMark = '❓';

/**
 * ReviseCommand
 */
class ReviseCommand extends Command {
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
   * @param {import('../repo/users').User} user
   */
  async processMsg(msg, user) {
    const word = await getRandomWordByUserIDForRevise(user._id);
    if (word === null) {
      this.#bot.sendMessage(
          msg.chat.id,
          'You have revised all your words 🎉',
      );
    }

    this.#bot.sendMessage(
        msg.chat.id,
        this.#renderMardown(word, QuestionMark),
        {
          parse_mode: 'MarkdownV2',
          reply_markup: {
            inline_keyboard: [
              [{
                text: 'Remember ✅',
                callback_data: `${ReviseCallbackId},${word._id},true`},
              {
                text: 'Forgot ❌',
                callback_data: `${ReviseCallbackId},${word._id},false`,
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

    let status = '';
    if (data.remember) {
      const res = await setWordAsRevisedByWordID(data.wordID);
      if (res !== null) {
        console.error(res);
        return;
      }
      status = '*Revised ✅*';
    } else {
      const res = await setWordAsForgottenByWordID(data.wordID);
      if (res !== null) {
        console.error(res);
        return;
      }
      status = '*Forgot ❌*';
    }

    const word = await getWordByID(data.wordID);
    if (word instanceof Error) {
      console.error(word);
      return;
    }
    if (word === null) {
      console.error(`can\'t find word by ID - ${data.wordID}`);
      return;
    }

    this.#bot.editMessageText(
        this.#renderMardown(word, status),
        {
          parse_mode: 'MarkdownV2',
          message_id: msg.message_id,
          chat_id: msg.chat.id,
        });
  };

  /**
   * @typedef CallbackData
   * @type {object}
   * @property {string} wordID
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
        wordID: rawData[0],
        remember: rawData[1] === 'true',
      };
    }
    return new Error(`can't parse callback_data: ${input}`);
  };

  /**
   * @param {import('../repo/words').Word} word
   * @param {string} status
   * @return {string}
   */
  #renderMardown = (word, status) => {
    const english = escapeMarkdown(word.English);
    const translation = escapeMarkdown(word.Translation);
    const examples = escapeMarkdown(word.Examples);

    return `
*English:*
${english} \\- ${status} 

*Examples:*
||${examples}||

*Translation:*
||${translation}||
          `;
  };
}

module.exports = {
  ReviseCommand,
  ReviseCallbackId,
};
