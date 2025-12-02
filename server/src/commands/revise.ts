import TelegramBot from 'node-telegram-bot-api';

import {Command} from './command.js';
import {
  Word,
  getRandomWordByUserIDForRevise,
  setWordAsRevisedByWordID,
  getWordByID,
  setWordAsForgottenByWordID,
  setWordTelegramAudioID,
} from '../repo/words.js';
import {renderWordWithCustomStatus} from '../render/renderWord.js';
import {
  renderNoMoreWordsToReviseForToday,
  renderYouHaveRevised_N_Words,
  renderYouHaveGoneThrough_N_Words,
} from '../render/renderTextMsg.js';
import {labelRemember, labelForgot, labelStopRevising, labelQuestionMark, labelRevised} from '../render/renderLabel.js';
import {Logger} from 'pino';

const ReviseCallbackId = '[REVISE]';

interface CallbackData {
  type: 'revise' | 'stop';
  wordID?: string;
  remember?: boolean;
  wordCount: number;
}

class ReviseCommand extends Command {
  private bot: TelegramBot;

  constructor(bot: TelegramBot, logger: Logger) {
    super(logger.child({command: 'ReviseCommand'}));
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

    const word = await getRandomWordByUserIDForRevise(user._id, this.logger.child(ctx));
    if (word === null) {
      this.bot.sendMessage(
          msg.chat.id,
          renderNoMoreWordsToReviseForToday(),
      );
      return null;
    }

    await this.sendWord(msg.chat.id, word, wordCount);
    return null;
  };

  sendWord = async (chatID: number, word: Word, wordCount?: number) => {
    const ctx = {chatID};

    const text = renderWordWithCustomStatus(word, labelQuestionMark);

    const options: TelegramBot.SendMessageOptions = {
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

    if (word.TelegramPictureID) {
      await this.bot.sendPhoto(chatID, word.TelegramPictureID);
    }

    if (word.TelegramAudioID) {
      await this.bot.sendVoice(
          chatID, word.TelegramAudioID,
          {
            ...options,
            caption: text,
          });
      return;
    }

    if (word.Audio) {
      const sentMsg = await this.bot.sendVoice(
          chatID,
          Buffer.from(word.Audio),
          {
            ...options,
            caption: text,
          },
          {
            filename: 'example.ogg',
            contentType: 'audio/ogg',
          },
      );
      if (sentMsg.voice) {
        setWordTelegramAudioID(word._id, sentMsg.voice.file_id, this.logger.child(ctx))
            .catch((err: Error) => this.logger.error({...ctx, err}, 'setWordTelegramAudioID error'));
      }
      return;
    }

    await this.bot.sendMessage(
        chatID,
        text,
        options,
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
          renderYouHaveRevised_N_Words(data.wordCount),
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

    let status = '';
    if (data.remember) {
      const res = await setWordAsRevisedByWordID(data.wordID, this.logger.child(ctx));
      if (res !== null) {
        this.logger.error({...ctx, err: res}, 'setWordAsRevisedByWordID error');
        return null;
      }
      status = labelRevised;
    } else {
      const res = await setWordAsForgottenByWordID(data.wordID, this.logger.child(ctx));
      if (res !== null) {
        this.logger.error({...ctx, err: res}, 'setWordAsForgottenByWordID error');
        return null;
      }
      status = `*${labelForgot}*`;
    }

    const word = await getWordByID(data.wordID, this.logger.child(ctx));
    if (word instanceof Error) {
      this.logger.error({...ctx, err: word}, 'getWordByID error');
      return null;
    }
    if (word === null) {
      this.logger.error(ctx, `can't find word by ID - ${data.wordID}`);
      return null;
    }

    const text = renderWordWithCustomStatus(word, status);

    const options: TelegramBot.EditMessageTextOptions = {
      parse_mode: 'MarkdownV2',
      message_id: msg.message_id,
      chat_id: msg.chat.id,
    };

    if (msg.caption) {
      this.bot.editMessageCaption(text, options);
    } else {
      this.bot.editMessageText(text, options);
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

export {
  ReviseCommand,
  ReviseCallbackId,
};
