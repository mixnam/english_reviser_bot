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
   * @param {import('./command').Logger} logger
   */
  constructor(bot, logger) {
    super(logger.child({command: 'ReviseCommand'}));
    this.#bot = bot;
  }

  /**
   * @type {Command['processMsg']}
   */
  async processMsg(msg, wordCount) {
    const ctx = {chatID: msg.chat.id};
    const user = await this.getSessionUser(msg);
    if (user instanceof Error) {
      this.logger.error(user);
      return;
    }
    ctx.userID = user._id;

    const word = await getRandomWordByUserIDForRevise(user._id, this.logger.child(ctx));
    if (word === null) {
      this.#bot.sendMessage(
          msg.chat.id,
          renderNoMoreWordsToReviseForToday(),
      );
      return;
    }

    this.sendWord(msg.chat.id, word, wordCount);
  };

  /**
   * @param {number} chatID
   * @param {import('../repo/words').Word} word
   * @param {number} [wordCount]
   */
  sendWord = async (chatID, word, wordCount) => {
    const ctx = {chatID};

    const text = renderWordWithCustomStatus(word, labelQuestionMark);
    /**
     * @type {Partial<import('../repo/words').Word>}
     */
    const wordToEdit = {
      _id: word._id,
      English: word.English,
      Examples: word.Examples,
      Translation: word.Translation,
    };

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
              text: 'Edit word',
              web_app: {
                url: process.env.TMA_URL +
                '#/edit-word?word=' + btoa(
                    encodeURIComponent(JSON.stringify(wordToEdit)),
                ) +
                '&chat_id=' + chatID +
                '&message_id=' + sentMsg.message_id,
              },
            },
          ],
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

    if (word.TelegramPictureID) {
      await this.#bot.sendPhoto(chatID, word.TelegramPictureID);
    }

    if (word.TelegramAudioID) {
      this.#bot.sendVoice(
          chatID, word.TelegramAudioID,
          {
            ...options,
            caption: text,
          });
      return;
    }

    if (word.Audio) {
      const sentMsg = await this.#bot.sendVoice(
          chatID, Buffer.from(word.Audio),
          {
            ...options,
            caption: text,
          });
      if (sentMsg.voice) {
        setWordTelegramAudioID(word._id, sentMsg.voice.file_id, this.logger.child(ctx))
            .catch((err) => this.logger.error(ctx, err));
      }
      return;
    }

    this.#bot.sendMessage(
        chatID,
        text,
        options,
    );
  };

  /**
   * @type {Command['processCallback']}
   */
  async processCallback(msg, rawData) {
    const ctx = {chatID: msg.chat.id};
    const data = this.#parseCallbackData(rawData);
    if (data instanceof Error) {
      this.logger.error(ctx, data);
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
      const res = await setWordAsRevisedByWordID(data.wordID, this.logger.child(ctx));
      if (res !== null) {
        this.logger.error(ctx, res);
        return;
      }
      status = labelRevised;
    } else {
      const res = await setWordAsForgottenByWordID(data.wordID, this.logger.child(ctx));
      if (res !== null) {
        this.logger.error(ctx, res);
        return;
      }
      status = `*${labelForgot}*`;
    }

    const word = await getWordByID(data.wordID, this.logger.child(ctx));
    if (word instanceof Error) {
      this.logger.error(ctx, word);
      return;
    }
    if (word === null) {
      this.logger.error(ctx, `can\'t find word by ID - ${data.wordID}`);
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
