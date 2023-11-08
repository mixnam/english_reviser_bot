// eslint-disable-next-line
const TelegramBot = require('node-telegram-bot-api');
const {Command} = require('./command');
const {getUserByChatID} = require('../repo/users');
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
   */
  async processMsg(msg ) {
    const user = await getUserByChatID(msg.chat.id);
    if (user instanceof Error) {
      console.log(user);
      return;
    }
    if (user === null) {
      console.error(`no user with chatID - ${msg.chat.id}`);
      return;
    }

    const word = await getRandomWordByUserIDForLearn(user._id);
    if (word === null) {
      this.#bot.sendMessage(
          msg.chat.id,
          'You have learned all your words 🎉',
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
                ].join(','),
              },
              {
                text: 'DOWN',
                callback_data: [
                  LearnCallbackId,
                  word._id,
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
}

module.exports = {
  LearnCommand,
  LearnCallbackId,
};
