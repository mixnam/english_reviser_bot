import {Logger} from 'pino';
import {ObjectId} from 'mongodb';
import {Bot} from '../../telegram.js';
import {getUserByChatID} from '../../repo/users.js';
import {
  getSpelcheckSuggestions,
  Progress,
  Word,
  getRandomWordByUserIDForRevise,
  setWordAsRevisedByWordID,
  setWordAsForgottenByWordID,
  getRandomWordByUserIDForLearn,
  ProgressOrder,
  setWordProgress,
  getWordByID,
} from '../../repo/words.js';
import * as OpenAIExamplesService from '../../services/openAIExamples.js';
import * as GoogleImageService from '../../services/googleImage.js';
import {minusDaysFromNow} from '../../repo/utils.js';

export class WordService {
  constructor(
    private bot: Bot,
    private logger: Logger,
  ) {}

  async getSimilarWords(chatID: number, word: string): Promise<string[] | Error> {
    const user = await getUserByChatID(chatID, this.logger);
    if (user instanceof Error) return user;
    if (!user) return new Error(`User not found for chatID: ${chatID}`);

    const suggestions = await getSpelcheckSuggestions(word, user._id, this.logger);
    if (suggestions instanceof Error) return suggestions;

    return suggestions.map(({English}) => English);
  }

  async generateExample(word: string, translate: string): Promise<string | null | Error> {
    return OpenAIExamplesService.getInstance().generateExampleSentence(
        word,
        translate,
        process.env.LANGUAGE_CODE,
        this.logger,
    );
  }

  // https://www.google.com/search?
  // q=ir+ilustra%C3%A7%C3%A3o
  // &sca_esv=6a3dc1d72e9664c9
  // &rlz=1C5CHFA_enPT1189PT1189
  // &udm=2
  // &biw=1512
  // &bih=861
  // &sxsrf=ANbL-n60BxBycFr6TVbebj1MmukqfN0knw%3A1771244198569
  // &ei=pgqTacW1IqWnkdUPi93r-Qs
  // &oq=Ir+
  // &gs_lp=Egtnd3Mtd2l6LWltZyIDSXIgKgIIADIHECMYJxjJAjIFEAAYgAQyBRAAGIAEMgUQABiABDIKEAAYgAQYQxiKBTIFEAAYgAQyChAAGIAEGEMYigUyChAAGIAEGEMYigUyBRAAGIAEMgoQABiABBhDGIoFSOsZULUBWLUBcAF4AJABAJgBXaABXaoBATG4AQPIAQD4AQGYAgKgAmeYAwCIBgGSBwEyoAehBrIHATG4B2LCBwMyLTLIBweACAA
  // &sclient=gws-wiz-img

  async searchImages(word: string, offset: number = 0): Promise<string[] | Error> {
    const query = `${word}+ilustração`;
    return GoogleImageService.getInstance().searchImages(query, this.logger, offset + 1);
  }

  async saveWord(
      chatID: number,
      wordText: string,
      translation: string,
      example: string | null,
      imageUrl: string | null,
  ): Promise<void | Error> {
    const user = await getUserByChatID(chatID, this.logger);
    if (user instanceof Error) return user;
    if (!user) return new Error(`User not found for chatID: ${chatID}`);

    const newWord: Word = {
      '_id': new ObjectId().toString(),
      'userID': user._id,
      'English': wordText,
      'Translation': translation,
      'Examples': example,
      'Progress': Progress.HaveProblems,
      'Last Revised': minusDaysFromNow(30),
    };

    try {
      await this.bot.handleWebAppMessage({
        type: 'add_word_msg',
        payload: {
          chatID,
          word: newWord,
          imageUrl,
        },
      });
    } catch (err) {
      return err;
    }
  }

  async getRandomReviseWord(chatID: number): Promise<Word | null | Error> {
    const user = await getUserByChatID(chatID, this.logger);
    if (user instanceof Error) return user;
    if (!user) return new Error(`User not found for chatID: ${chatID}`);

    return getRandomWordByUserIDForRevise(user._id, this.logger);
  }

  async updateWordProgress(
      chatID: number,
      wordID: string,
      remember: boolean,
  ): Promise<void | Error> {
    const user = await getUserByChatID(chatID, this.logger);
    if (user instanceof Error) return user;
    if (!user) return new Error(`User not found for chatID: ${chatID}`);

    if (remember) {
      const result = await setWordAsRevisedByWordID(wordID, this.logger);
      return result === null ? undefined : result;
    } else {
      const result = await setWordAsForgottenByWordID(wordID, this.logger);
      return result === null ? undefined : result;
    }
  }

  async getRandomLearnWord(chatID: number): Promise<Word | null | Error> {
    const user = await getUserByChatID(chatID, this.logger);
    if (user instanceof Error) return user;
    if (!user) return new Error(`User not found for chatID: ${chatID}`);

    return getRandomWordByUserIDForLearn(user._id, this.logger);
  }

  async updateLearnWordProgress(
      chatID: number,
      wordID: string,
      remember: boolean,
  ): Promise<void | Error> {
    const word = await getWordByID(wordID, this.logger);
    if (word instanceof Error) {
      return word || new Error('Word not found');
    }
    if (!word) {
      return new Error('word not found in DB');
    }


    const currentProgressIdx = ProgressOrder.findIndex((i) => i === word.Progress);
    let nextProgress;
    if (remember) {
      nextProgress = ProgressOrder[currentProgressIdx + 1] ?? word.Progress;
    } else {
      nextProgress = ProgressOrder[currentProgressIdx - 1] ?? word.Progress;
    }

    const result = await setWordProgress(word._id, nextProgress, this.logger);
    return result === null ? undefined : result;
  }

  async editWord(
      chatID: number,
      messageID: number,
      word: Word,
  ): Promise<void | Error> {
    try {
      await this.bot.handleWebAppMessage({
        type: 'edit_word_msg',
        payload: {
          word,
          chatID,
          messageID,
        },
      });
    } catch (err) {
      return err;
    }
  }
}
