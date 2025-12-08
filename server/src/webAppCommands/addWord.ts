import TelegramBot from 'node-telegram-bot-api';
import http from 'http';
import https from 'https';
import {IncomingMessage} from 'http';
import {Readable} from 'stream';
import {Logger} from 'pino';
import {renderYouJustAddedNewWord} from '../render/renderTextMsg.js';
import {addNewWord, setWordTelegramAudioID, Word} from '../repo/words.js';
import {uploadPicture} from '../repo/files.js';
import {TTSService} from '../tts/openaiTts.js';
import {WebAppCommand} from './webAppCommand.js';

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

      TTSService.getAudioForText(word.Examples || word.English),

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
    }

    let imageBuffer: Buffer | null = null;

    if (imageResponse && !(imageResponse instanceof Error)) {
      if (imageResponse.statusCode === 200) {
        try {
          // Read stream to buffer
          const chunks: Uint8Array[] = [];
          for await (const chunk of imageResponse) {
            chunks.push(chunk);
          }
          imageBuffer = Buffer.concat(chunks);

          // Create new stream for upload
          const fileStream = Readable.from(imageBuffer);
          const fileName = await uploadPicture(fileStream, this.logger);
          word.PictureFileName = fileName;
        } catch (err) {
          this.logger.error({err, imageUrl}, 'Failed to process/upload picture');
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

    if (imageBuffer) {
      try {
        await this.bot.sendPhoto(user.chatID, imageBuffer);
      } catch (err) {
        this.logger.error({err}, 'Failed to send photo to Telegram');
      }
    }

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

