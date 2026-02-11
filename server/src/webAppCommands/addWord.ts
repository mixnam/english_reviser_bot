import TelegramBot from 'node-telegram-bot-api';
import http from 'http';
import https from 'https';
import {IncomingMessage} from 'http';
import {Logger} from 'pino';
import {renderYouJustAddedNewWord} from '../render/renderTextMsg.js';
import {addNewWord, setWordTelegramAudioID, Word} from '../repo/words.js';
import * as TTSService from '../tts/openaiTts.js';
import {WebAppCommand} from './webAppCommand.js';
import * as GoogleCloudStorage from '../services/googleCloudStorage.js';

export type AddWordPayload = {
  chatID: number;
  imageUrl: string | null;
  word: Word;
}

export type AddWordMsg = {
  type: 'add_word_msg';
  payload: AddWordPayload;
}

class AddWordCommand extends WebAppCommand<AddWordMsg> {
  constructor(bot: TelegramBot, logger: Logger) {
    super(bot, logger);
  }

  override processMsg = async (msg: AddWordMsg): Promise<Error | void> => {
    const {
      chatID,
      imageUrl,
      word,
    } = msg.payload;

    const [user, audio, imageResponse] = await Promise.all([
      this.getSessionUser(chatID),

      TTSService.getInstance().getAudioForText(word.Examples || word.English),

      imageUrl !== null ?
        new Promise<IncomingMessage | Error>((resolve) => {
          const client = imageUrl.startsWith('https') ? https : http;
          const req = client.get(imageUrl, (response) => {
            resolve(response);
          });
          req.on('error', (err) => resolve(err));
        }) :
        Promise.resolve<null>(null),
    ]);


    if (user instanceof Error) {
      this.logger.error(user);
      return user;
    }

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

    if (imageResponse && !(imageResponse instanceof Error)) {
      if (imageResponse.statusCode === 200) {
        try {
          const imageURL = await GoogleCloudStorage.getInstance().uploadImage(
              imageResponse,
              word._id,
              this.logger,
          );
          word.ImageURL = imageURL;
        } catch (err) {
          this.logger.error({err, imageUrl}, 'Failed to process/upload picture');
        }

        try {
          await this.bot.sendPhoto(user.chatID, imageResponse);
        } catch (err) {
          this.logger.error({err}, 'Failed to send photo to Telegram');
        }
      } else {
        this.logger.warn({statusCode: imageResponse.statusCode}, 'Image response not 200');
      }
    } else if (imageResponse instanceof Error) {
      this.logger.error(imageResponse);
    }


    const result = await addNewWord(
        user._id,
        word,
        this.logger,
    );

    if (result instanceof Error) {
      this.logger.error(result);
      return result;
    }

    const actionText = renderYouJustAddedNewWord(word);

    const sendMsgPromise = audio ?
    this.bot.sendVoice(user.chatID, Buffer.from(audio), {
      caption: actionText,
      parse_mode: 'MarkdownV2',
    }, {
      filename: 'example.ogg',
      contentType: 'audio/ogg',
    }) :
        this.bot.sendMessage(user.chatID, actionText, {
          parse_mode: 'MarkdownV2',
        });

    try {
      const msg = await sendMsgPromise;

      if (msg.voice) {
        setWordTelegramAudioID(result, msg.voice.file_id, this.logger)
            .then(() => null)
            .catch((err) => this.logger.error(err));
      }
    } catch (err) {
      this.logger.error(err);
      return;
    }
  };
}

export {
  AddWordCommand,
};

