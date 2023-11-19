// eslint-disable-next-line
const TelegramBot = require('node-telegram-bot-api');
const {Command} = require('./command');
const {
  getRandomWordByUserIDForLearn,
  ProgressOrder,
  getWordByID,
  setWordProgress,
} = require('../repo/words');
const {
  renderWordWithCustomStatus,
  mapWordProgressToStatus,
} = require('../render/renderWord');

const LearnCallbackId = '[LEARN]';
const StopLearningText = 'Stop learning';

/**
 * LearnCommand
 */
class LearnCommand extends Command {
  #bot;

  /**
   * LearnCommand constructor
   * @param {TelegramBot} bot
   */
  constructor(bot ) {
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

    const word = await getRandomWordByUserIDForLearn(user._id);
    if (word === null) {
      this.#bot.sendMessage(
          msg.chat.id,
          'You have learned all your words for today 🎉',
      );
      return;
    }

    this.#bot.sendMessage(
        msg.chat.id,
        renderWordWithCustomStatus(
            word,
            mapWordProgressToStatus[word.Progress],
        ),
        {
          parse_mode: 'MarkdownV2',
          reply_markup: {
            inline_keyboard: [
              [{
                text: 'UP',
                callback_data: [
                  LearnCallbackId,
                  word._id,
                  'true',
                  wordCount ?? 0,
                ].join(','),
              },
              {
                text: 'DOWN',
                callback_data: [
                  LearnCallbackId,
                  word._id,
                  'false',
                  wordCount ?? 0,
                ].join(','),
              }],
              [
                {
                  text: StopLearningText,
                  callback_data: [
                    LearnCallbackId,
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
          `You learned ${data.wordCount} words today`,
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

    const word = await getWordByID(data.wordID);
    if (word instanceof Error) {
      console.error(word);
      return;
    }

    const currentProgressIdx = ProgressOrder.findIndex(
        (i) => i === word.Progress,
    );

    let nextProgress;
    if (data.remember) {
      nextProgress = ProgressOrder[currentProgressIdx + 1] ?? word.Progress;
    } else {
      nextProgress = ProgressOrder[currentProgressIdx - 1] ?? word.Progress;
    }

    const result = await setWordProgress(word._id, nextProgress);
    if (result !== null) {
      console.error(result);
      return;
    }

    this.#bot.editMessageText(
        renderWordWithCustomStatus(word, mapWordProgressToStatus[nextProgress]),
        {
          parse_mode: 'MarkdownV2',
          message_id: msg.message_id,
          chat_id: msg.chat.id,
        },
    );
    this.processMsg(msg, wordCount);
  };

  /**
   * @typedef CallbackData
   * @type {StopCallbackData|LearnCallbackData}
   */

  /**
   * @typedef StopCallbackData
   * @type {object}
   * @property {'stop'} type
   * @property {number} wordCount
   */

  /**
   * @typedef LearnCallbackData
   * @type {object}
   * @property {'learn'} type
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
        type: 'learn',
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
  LearnCommand,
  LearnCallbackId,
};
