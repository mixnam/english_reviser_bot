// eslint-disable-next-line
const TelegramBot = require('node-telegram-bot-api');
const {Command} = require('./command');
const {
  getRandomWordByUserIDForRevise,
  setWordAsRevisedByWordID,
  getWordByID,
  setWordAsForgottenByWordID,
} = require('../repo/words');
const {renderWordWithCustomStatus} = require('../render/renderWord');

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
   * @param {number | undefined} wordCount
   */
  async processMsg(msg, wordCount) {
    const user = await this.getSessionUser(msg);
    if (user instanceof Error) {
      console.error(user);
      return;
    }

    const word = await getRandomWordByUserIDForRevise(user._id);
    if (word === null) {
      this.#bot.sendMessage(
          msg.chat.id,
          'You have revised all your words for today 🎉',
      );
      return;
    }

    this.#bot.sendMessage(
        msg.chat.id,
        renderWordWithCustomStatus(word, QuestionMark),
        {
          parse_mode: 'MarkdownV2',
          reply_markup: {
            inline_keyboard: [
              [{
                text: 'Remember ✅',
                callback_data: [
                  ReviseCallbackId,
                  word._id,
                  true,
                  wordCount ?? 0,
                ].join(','),
              },
              {
                text: 'Forgot ❌',
                callback_data: [
                  ReviseCallbackId,
                  word._id,
                  false,
                  wordCount ?? 0,
                ].join(','),
              }],
              [
                {
                  text: 'Stop revising',
                  callback_data: [
                    ReviseCallbackId,
                    wordCount ?? 0,
                  ].join(','),
                },
              ],
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

    if (data.type === 'stop') {
      this.#bot.deleteMessage(msg.chat.id, msg.message_id);
      this.#bot.sendMessage(
          msg.chat.id,
          `You revised ${data.wordCount} words today`,
      );
      return;
    }

    const wordCount = data.wordCount + 1;

    if (wordCount !== 0 && wordCount % 10 === 0) {
      this.#bot.sendMessage(
          msg.chat.id,
          `You have done ${wordCount} words! Great result 🎉 `,
      );
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
        renderWordWithCustomStatus(word, status),
        {
          parse_mode: 'MarkdownV2',
          message_id: msg.message_id,
          chat_id: msg.chat.id,
        });
    this.processMsg(msg, wordCount);
  };

  /**
   * @typedef CallbackData
   * @type {StopCallbackData|ReviseCallbackData}
   */

  /**
   * @typedef StopCallbackData
   * @type {object}
   * @property {'stop'} type
   * @property {number} wordCount
   */

  /**
   * @typedef ReviseCallbackData
   * @type {object}
   * @property {'revise'} type
   * @property {string} wordID
   * @property {boolean} remember
   * @property {number} wordCount
   */

  /**
   * @param {Array<any>} rawData
   * @return {CallbackData|Error}
   */
  #parseCallbackData = (rawData) => {
    if (
      rawData.length === 3 &&
    typeof rawData[0] === 'string' &&
      (rawData[1] === 'true' || rawData[1] === 'false') &&
        typeof rawData[2] === 'string'
    ) {
      return {
        type: 'revise',
        wordID: rawData[0],
        remember: rawData[1] === 'true',
        wordCount: Number.parseInt(rawData[2]),
      };
    }
    if (rawData.length === 1 && typeof rawData[0] === 'string') {
      return {
        type: 'stop',
        wordCount: Number.parseInt(rawData[0]),
      };
    }

    return new Error(`can't parse callback_data: ${input}`);
  };
}

module.exports = {
  ReviseCommand,
  ReviseCallbackId,
};
