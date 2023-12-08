// eslint-disable-next-line
const TelegramBot = require('node-telegram-bot-api');
const {Command} = require('./command');
const {
  getRandomWordByUserIDForLearn,
  ProgressOrder,
  getWordByID,
  setWordProgress,
  setWordTelegramAudioID,
} = require('../repo/words');
const {
  renderWordWithCustomStatus,
  mapWordProgressToStatus,
} = require('../render/renderWord');
const {
  renderNoMoreWordsToLearnForToday,
  renderYouHaveCovered_N_Words,
  renderYouHaveGoneThrough_N_Words,
} = require('../render/renderTextMsg');
const {labelUp, labelDown, labelStopLearning} = require('../render/renderLabel');

const LearnCallbackId = '[LEARN]';

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
   * @type {Command['processMsg']}
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
          renderNoMoreWordsToLearnForToday(),
      );
      return;
    }

    const text = renderWordWithCustomStatus(
        word,
        mapWordProgressToStatus[word.Progress],
    );
    /**
     * @type {TelegramBot.SendMessageOptions}
     */
    const options = {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [
          [{
            text: labelUp,
            callback_data: [
              LearnCallbackId,
              word._id,
              'true',
              wordCount ?? 0,
            ].join(','),
          },
          {
            text: labelDown,
            callback_data: [
              LearnCallbackId,
              word._id,
              'false',
              wordCount ?? 0,
            ].join(','),
          }],
          [
            {
              text: labelStopLearning,
              callback_data: [
                LearnCallbackId,
                wordCount ?? 0,
              ].join(','),
            },
          ],
        ],
      },
    };

    if (word.TelegramAudioID) {
      this.#bot.sendVoice(
          msg.chat.id, word.TelegramAudioID,
          {
            ...options,
            caption: text,
          });
      return;
    }

    if (word.Audio) {
      const sentMsg = await this.#bot.sendVoice(
          msg.chat.id, Buffer.from(word.Audio),
          {
            ...options,
            caption: text,
          });
      if (sentMsg.voice) {
        setWordTelegramAudioID(word._id, sentMsg.voice.file_id)
            .catch((err) => console.error(err));
      }
      return;
    }

    this.#bot.sendMessage(
        msg.chat.id,
        text,
        options,
    );
  };

  /**
   * @type {Command['processCallback']}
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
          renderYouHaveCovered_N_Words(data.wordCount),
      );
      return;
    }

    const wordCount = data.wordCount + 1;

    if (wordCount !== 0 && wordCount % 10 === 0) {
      this.#bot.sendMessage(
          msg.chat.id,
          renderYouHaveGoneThrough_N_Words(wordCount),
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

    const wordText = renderWordWithCustomStatus(
        word,
        mapWordProgressToStatus[nextProgress],
    );
    /**
     * @type {TelegramBot.EditMessageTextOptions}
     */
    const msgOptions = {
      parse_mode: 'MarkdownV2',
      message_id: msg.message_id,
      chat_id: msg.chat.id,
    };

    if (msg.text) {
      this.#bot.editMessageText(wordText, msgOptions);
    } else if (msg.caption) {
      this.#bot.editMessageCaption(wordText, msgOptions);
    }

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
    return new Error(`can't parse callback_data: ${rawData}`);
  };
}

module.exports = {
  LearnCommand,
  LearnCallbackId,
};
