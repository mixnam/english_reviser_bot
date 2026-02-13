import TelegramBot from 'node-telegram-bot-api';

import {Command} from './command.js';
import {
  getRandomWordByUserIDForLearn,
  ProgressOrder,
  getWordByID,
  setWordProgress,
  setWordTelegramAudioID,
  Word,
} from '../repo/words.js';
import {
  renderWordWithCustomStatus,
  mapWordProgressToStatus,
} from '../render/renderWord.js';
import {
  renderNoMoreWordsToLearnForToday,
  renderYouHaveCovered_N_Words,
  renderYouHaveGoneThrough_N_Words,
} from '../render/renderTextMsg.js';
import {labelUp, labelDown, labelStopLearning} from '../render/renderLabel.js';
import {Logger} from 'pino';

const LearnCallbackId = '[LEARN]';

interface CallbackData {
  type: 'learn' | 'stop';
  wordID?: string;
  remember?: boolean;
  wordCount: number;
}

/**
 * LearnCommand
 */
class LearnCommand extends Command {
  private bot: TelegramBot;

  /**
   * LearnCommand constructor
   * @param {TelegramBot} bot
   * @param {Logger} logger
   */
  constructor(bot: TelegramBot, logger: Logger) {
    super(logger.child({command: 'LearnCommand'}));
    this.bot = bot;
  }

  processMsg = async (msg: TelegramBot.Message, wordCount?: number): Promise<null> => {
    const ctx: {chatID: number; userID?: string} = {chatID: msg.chat.id};
    const user = await this.getSessionUser(msg);
    if (user instanceof Error) {
      this.logger.error({...ctx, err: user}, 'User error');
      return null;
    }
    ctx.userID = user._id;

    const word: Word | null = await getRandomWordByUserIDForLearn(user._id, this.logger.child(ctx));
    if (word === null) {
      this.bot.sendMessage(
          msg.chat.id,
          renderNoMoreWordsToLearnForToday(),
      );
      return null;
    }

    try {
      await this.sendLearnWordMessage(msg.chat.id, word, wordCount);
    } catch (err) {
      this.logger.error({...ctx, err, wordID: word._id}, 'error sending word to learn');
    }
    return null;
  };

  /**
   * @param {number} chatID
   * @param {Word} word
   * @param {number} [wordCount]
   */
  sendLearnWordMessage = async (chatID: number, word: Word, wordCount?: number) => {
    const ctx = {chatID};
    const wordToEdit: Partial<Word> = {
      _id: word._id,
      English: word.English,
      Examples: word.Examples,
      Translation: word.Translation,
    };

    const text = renderWordWithCustomStatus(
        word,
        mapWordProgressToStatus[word.Progress],
    );

    const options: TelegramBot.SendMessageOptions = {
      parse_mode: 'MarkdownV2',
    };

    if (word.TelegramPictureID) {
      await this.bot.sendPhoto(chatID, word.TelegramPictureID);
    }

    let sentMsg: TelegramBot.Message;
    if (!(Boolean(word.TelegramAudioID) || Boolean(word.AudioURL))) {
      // if there is no audio at all, just send text msg and that's it
      sentMsg = await this.bot.sendMessage(
          chatID,
          text,
          options,
      );
    } else if (word.TelegramAudioID) {
      sentMsg = await this.bot.sendVoice(
          chatID,
          word.TelegramAudioID,
          {
            ...options,
            caption: text,
          });
    } else if (word.AudioURL) {
      sentMsg = await this.bot.sendVoice(
          chatID,
          word.AudioURL,
          {
            ...options,
            caption: text,
          });
      if (sentMsg.voice) {
        setWordTelegramAudioID(word._id, sentMsg.voice.file_id, this.logger.child(ctx))
            .catch((err: Error) => this.logger.error({...ctx, err}, 'setWordTelegramAudioID error'));
      }
    } else {
      // Fallback should not happen given checks above
      sentMsg = await this.bot.sendMessage(chatID, text, options);
    }

    await this.bot.editMessageReplyMarkup({
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
            text: labelStopLearning,
            callback_data: [
              LearnCallbackId,
              wordCount ?? 0,
            ].join(','),
          },
        ],
      ],
    },
    {
      chat_id: ctx.chatID,
      message_id: sentMsg.message_id,
    },
    );
  };

  async processCallback(msg: TelegramBot.Message, rawData: unknown[]): Promise<null> {
    const ctx = {chatID: msg.chat.id};
    const data = this.parseCallbackData(rawData);
    if (data instanceof Error) {
      this.logger.error({...ctx, err: data}, 'Parse callback data error');
      return null;
    }

    if (data.type === 'stop') {
      this.bot.deleteMessage(msg.chat.id, msg.message_id);
      this.bot.sendMessage(
          msg.chat.id,
          renderYouHaveCovered_N_Words(data.wordCount),
      );
      return null;
    }

    const wordCount = data.wordCount + 1;

    if (wordCount !== 0 && wordCount % 10 === 0) {
      this.bot.sendMessage(
          msg.chat.id,
          renderYouHaveGoneThrough_N_Words(wordCount),
      );
    }

    const word = await getWordByID(data.wordID, this.logger.child(ctx));
    if (word instanceof Error) {
      this.logger.error({...ctx, err: word}, 'Get word by ID error');
      return null;
    }

    const currentProgressIdx = ProgressOrder.findIndex(
        (i) => i === word.Progress,
    );

    // TODO :: define this as a Progress
    let nextProgress;
    if (data.remember) {
      nextProgress = ProgressOrder[currentProgressIdx + 1] ?? word.Progress;
    } else {
      nextProgress = ProgressOrder[currentProgressIdx - 1] ?? word.Progress;
    }

    const result = await setWordProgress(word._id, nextProgress, this.logger.child(ctx));
    if (result !== null) {
      this.logger.error({...ctx, err: result}, 'Set word progress error');
      return null;
    }

    const wordText = renderWordWithCustomStatus(
        word,
        mapWordProgressToStatus[nextProgress],
    );

    const msgOptions: TelegramBot.EditMessageTextOptions = {
      parse_mode: 'MarkdownV2',
      message_id: msg.message_id,
      chat_id: msg.chat.id,
    };

    if (msg.text) {
      this.bot.editMessageText(wordText, msgOptions);
    } else if (msg.caption) {
      this.bot.editMessageCaption(wordText, msgOptions);
    }

    this.processMsg(msg, wordCount);
    return null;
  };

  private parseCallbackData = (rawData: unknown[]): CallbackData | Error => {
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

export {
  LearnCommand,
  LearnCallbackId,
};
