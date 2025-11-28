import {renderYouJustAddedNewWord} from '../render/renderTextMsg.js';

import {addNewWord, setWordTelegramAudioID} from '../repo/words.js';

import {TTSService} from '../tts/openaiTts.js';

import {WebAppCommand} from './webAppCommand.js';

/**
 * @typedef AddWordPayload
 * @type {object}
 * @property {number} chatID
 * @property {import('../repo/words.js').Word} word
 */

/**
 * @typedef AddWordMsg
 * @type {object}
 * @property {'add_word_msg'} type
 * @property {AddWordPayload} payload
 */

/**
 * @extends {WebAppCommand<AddWordMsg>}
 */
class AddWordCommand extends WebAppCommand {
  /**
   * @param {import('node-telegram-bot-api')} bot
   * @param {import('./webAppCommand.js').Logger} logger
   */
  constructor(bot, logger) {
    super(bot, logger);
  }

  /**
   * @param {AddWordMsg} msg
   */
  async processMsg(msg) {
    const {
      chatID,
      word,
    } = msg.payload;
    const user = await this.getSessionUser(chatID);
    if (user instanceof Error) {
      this.logger.error(user);
      return user;
    }

    const textToAudio = word.Examples || word.English;

    const audio = await TTSService.getAudioForText(textToAudio);

    if (audio instanceof Error) {
      this.logger.error(audio);
      return audio;
    } else {
      word.Audio = audio;
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
  }
}

export {
  AddWordCommand,
};
