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
import * as GoogleCloudStorage from '../../services/googleCloudStorage.js';
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

  async searchImages(word: string, offset: number = 0): Promise<string[] | Error> {
    const query = `ilustração ${word}`;
    return GoogleImageService.getInstance().searchImages(query, this.logger, offset + 1);
  }

  async uploadImage(file: Buffer, mimetype: string): Promise<string | Error> {
    const MIME_TYPES_TO_EXTENSION = {
      'image/apng': 'apng',
      'image/avif': 'avif',
      'image/gif': 'gif',
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/svg+xml': 'svg',
      'image/webp': 'webp',
    };

    const extension = (MIME_TYPES_TO_EXTENSION as any)[mimetype] || 'jpg';
    const fileName = `${new ObjectId().toString()}.${extension}`;

    try {
      return await GoogleCloudStorage.getInstance().uploadImage(file, fileName, this.logger);
    } catch (err) {
      this.logger.error({err}, 'Failed to upload image to GCS');
      return err instanceof Error ? err : new Error(String(err));
    }
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
