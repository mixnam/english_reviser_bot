import {updateWord} from '../repo/words.js';
import {TTSService} from '../tts/openaiTts.js';
import {WebAppCommand} from './webAppCommand.js';

/**
 * @typedef EditWordPayload
 * @type {object}
 * @property {number} chatID
 * @property {number} messageID
 * @property {import('../repo/words.js').Word} word
 */

/**
 * @typedef EditWordMsg
 * @type {object}
 * @property {'edit_word_msg'} type
 * @property {EditWordPayload} payload
 */

/**
 * @extends {WebAppCommand<EditWordMsg>}
 */
class EditWordCommand extends WebAppCommand {
  /**
   * @param {import('node-telegram-bot-api')} bot
   * @param {import('./webAppCommand.js').Logger} logger
   * @param {(chatID: number, word: import('../repo/words.js').Word, wordCount?: number) => Promise<void>} sendWord
   */
  constructor(bot, logger, sendWord) {
    super(bot, logger);
    this.sendWord = sendWord;
  }

  /**
   * @param {EditWordMsg} msg
   */
  async processMsg(msg) {
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

    const audio = await TTSService.getAudioForText(word.English);

    if (audio instanceof Error) {
      this.logger.error(audio);
      return audio;
    } else {
      word.Audio = audio;
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
