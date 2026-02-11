import TelegramBot from 'node-telegram-bot-api';
import {Logger} from 'pino';
import {updateWord, Word} from '../repo/words.js';
import * as TTSService from '../tts/openaiTts.js';
import {WebAppCommand} from './webAppCommand.js';
import * as GoogleCloudStorage from '../services/googleCloudStorage.js';

export interface EditWordPayload {
  chatID: number;
  messageID: number;
  word: Word;
}

export interface EditWordMsg {
  type: 'edit_word_msg';
  payload: EditWordPayload;
}

class EditWordCommand extends WebAppCommand<EditWordMsg> {
  private sendWord: (chatID: number, word: Word, wordCount?: number) => Promise<void>;

  constructor(
      bot: TelegramBot,
      logger: Logger,
      sendWord: (chatID: number, word: Word, wordCount?: number) => Promise<void>,
  ) {
    super(bot, logger);
    this.sendWord = sendWord;
  }

  override async processMsg(msg: EditWordMsg): Promise<Error | void> {
    const {
      chatID,
      messageID,
      word,
    } = msg.payload;
    const user = await this.getSessionUser(chatID);
    if (user instanceof Error) {
      this.logger.error(user);
      return user;
    }

    const audio = await TTSService.getInstance().getAudioForText(word.English);

    if (audio instanceof Error) {
      this.logger.error(audio);
      return audio;
    } else {
      word.Audio = audio;
      try {
        const audioURL = await GoogleCloudStorage.getInstance().uploadAudio(
            audio,
            `${word._id}.ogg`,
            this.logger,
        );
        word.AudioURL = audioURL;
      } catch (err) {
        this.logger.error({err}, 'Failed to upload audio to GCS');
      }
    }

    const result = await updateWord(
        user._id,
        word,
        this.logger,
    );

    if (result instanceof Error) {
      this.logger.error(result);
      return result;
    }

    await this.bot.deleteMessage(chatID, messageID);
    await this.sendWord(chatID, word);
  }
}

export {
  EditWordCommand,
};

