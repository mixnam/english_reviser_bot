// eslint-disable-next-line
const TelegramBot = require('node-telegram-bot-api');
const {Command} = require('./command');
const {
  getRandomWordByUserIDForRevise,
  setWordAsRevisedByWordID,
  getWordByID,
  setWordAsForgottenByWordID,
  setWordTelegramAudioID,
} = require('../repo/words');
const {renderWordWithCustomStatus} = require('../render/renderWord');
const {
  renderNoMoreWordsToReviseForToday,
  renderYouHaveRevised_N_Words,
  renderYouHaveGoneThrough_N_Words,
} = require('../render/renderTextMsg');
const {labelRemember, labelForgot, labelStopRevising, labelQuestionMark, labelRevised} = require('../render/renderLabel');

const ReviseCallbackId = '[REVISE]';

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
   * @type {Command['processMsg']}
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
          renderNoMoreWordsToReviseForToday(),
      );
      return;
    }

    const text = renderWordWithCustomStatus(word, labelQuestionMark);
    /**
     * @type {TelegramBot.SendMessageOptions}
     */
    const options = {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [
          [{
            text: labelRemember,
            callback_data: [
              ReviseCallbackId,
              word._id,
              true,
              wordCount ?? 0,
            ].join(','),
          },
          {
            text: labelForgot,
            callback_data: [
              ReviseCallbackId,
              word._id,
              false,
              wordCount ?? 0,
            ].join(','),
          }],
          [
            {
              text: labelStopRevising,
              callback_data: [
                ReviseCallbackId,
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
          msg.chat.id, word.Audio,
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
          renderYouHaveRevised_N_Words(data.wordCount),
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

    let status = '';
    if (data.remember) {
      const res = await setWordAsRevisedByWordID(data.wordID);
      if (res !== null) {
        console.error(res);
        return;
      }
      status = labelRevised;
    } else {
      const res = await setWordAsForgottenByWordID(data.wordID);
      if (res !== null) {
        console.error(res);
        return;
      }
      status = `*${labelForgot}*`;
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

    const text = renderWordWithCustomStatus(word, status);
    /**
     * @type{TelegramBot.EditMessageTextOptions}
     */
    const options = {
      parse_mode: 'MarkdownV2',
      message_id: msg.message_id,
      chat_id: msg.chat.id,
    };

    if (msg.caption) {
      this.#bot.editMessageCaption(text, options);
    } else {
      this.#bot.editMessageText(text, options);
    }

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

    return new Error(`can't parse callback_data: ${rawData}`);
  };
}

module.exports = {
  ReviseCommand,
  ReviseCallbackId,
};
