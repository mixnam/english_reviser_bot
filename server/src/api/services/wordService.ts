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
  deleteWord,
  addNewWord,
  updateWord,
} from '../../repo/words.js';
import * as OpenAIExamplesService from '../../services/openAIExamples.js';
import * as OpenAIImageQueryPlanner from '../../services/openAIImageQueryPlanner.js';
import {
  buildDeterministicImageSearchQuery,
  searchImagesForQuery,
} from '../../services/imageSearchPipeline.js';
import * as GoogleCloudStorage from '../../services/googleCloudStorage.js';
import * as TTSService from '../../tts/openaiTts.js';
import {minusDaysFromNow} from '../../repo/utils.js';
import http from 'http';
import https from 'https';
import {IncomingMessage} from 'http';

const MIME_TYPES_TO_EXTENSION: Record<string, string> = {
  'image/apng': 'apng',
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
};

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

  async searchImages(word: string, translation: string, offset: number = 0): Promise<string[] | Error> {
    const deterministicQuery = buildDeterministicImageSearchQuery(word, translation);
    const planned = await OpenAIImageQueryPlanner.getInstance().plan(word, translation, this.logger);
    const query = planned?.query || deterministicQuery;

    const results = await searchImagesForQuery(query, this.logger, offset, 5);
    if (results instanceof Error) return results;

    this.logger.info({
      word,
      translation,
      offset,
      query,
      plannerUsed: Boolean(planned?.query),
      plannerConfidence: planned?.confidence ?? null,
      candidates: results.map(({url, title, displayLink}) => ({url, title, displayLink})),
    }, 'Image search candidates');

    return results.map(({url}) => url);
  }

  async uploadImage(file: Buffer, mimetype: string): Promise<string | Error> {
    const extension = MIME_TYPES_TO_EXTENSION[mimetype] || 'jpg';
    const fileName = `${new ObjectId().toString()}.${extension}`;

    try {
      return await GoogleCloudStorage.getInstance().uploadImage(file, fileName, this.logger);
    } catch (err) {
      this.logger.error({err}, 'Failed to upload image to GCS');
      return err instanceof Error ? err : new Error(String(err));
    }
  }

  private async fetchRemoteImage(imageUrl: string): Promise<IncomingMessage | Error> {
    return new Promise<IncomingMessage | Error>((resolve) => {
      const client = imageUrl.startsWith('https') ? https : http;
      const req = client.get(imageUrl, (response) => resolve(response));
      req.on('error', (err) => resolve(err));
    });
  }

  async saveWord(
      chatID: number,
      wordText: string,
      translation: string,
      example: string | null,
      imageUrl: string | null,
  ): Promise<Word | Error> {
    const user = await getUserByChatID(chatID, this.logger);
    if (user instanceof Error) return user;
    if (!user) return new Error(`User not found for chatID: ${chatID}`);

    const wordId = new ObjectId().toString();

    try {
      const audio = await TTSService.getInstance().getAudioForText(example || wordText);
      if (audio instanceof Error) return audio;

      const audioURL = await GoogleCloudStorage.getInstance().uploadAudio(
          audio,
          `${wordId}.ogg`,
          this.logger,
      );

      let finalImageUrl: string | undefined = undefined;
      if (imageUrl) {
        if (imageUrl.includes(process.env.GOOGLE_CLOUD_STORAGE_BUCKET!)) {
          finalImageUrl = imageUrl;
        } else {
          const imageResponse = await this.fetchRemoteImage(imageUrl);
          if (imageResponse instanceof Error) return imageResponse;

          if (imageResponse.statusCode !== 200) {
            throw new Error(`Failed to fetch image: status ${imageResponse.statusCode}`);
          }

          const contentType = imageResponse.headers['content-type'] || 'image/jpeg';
          const extension = MIME_TYPES_TO_EXTENSION[contentType] || 'jpeg';
          finalImageUrl = await GoogleCloudStorage.getInstance().uploadImage(
              imageResponse,
              `${wordId}.${extension}`,
              this.logger,
          );
        }
      }

      const newWord: Word = {
        '_id': wordId,
        'userID': user._id,
        'English': wordText,
        'Translation': translation,
        'Examples': example,
        'Progress': Progress.HaveProblems,
        'Last Revised': minusDaysFromNow(30),
        'AudioURL': audioURL,
        'ImageURL': finalImageUrl,
      };

      const result = await addNewWord(user._id, newWord, this.logger);
      if (result instanceof Error) throw result;

      return newWord;
    } catch (err) {
      this.logger.error({err}, 'Transactional saveWord failed');
      return err instanceof Error ? err : new Error(String(err));
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
      word: Word,
  ): Promise<void | Error> {
    const user = await getUserByChatID(chatID, this.logger);
    if (user instanceof Error) return user;
    if (!user) return new Error(`User not found for chatID: ${chatID}`);

    const existingWord = await getWordByID(word._id, this.logger);
    if (existingWord instanceof Error) return existingWord;
    if (!existingWord) return new Error(`Word not found: ${word._id}`);

    word.Progress = existingWord.Progress;

    try {
      if (word.English !== existingWord.English || word.Examples !== existingWord.Examples) {
        const audio = await TTSService.getInstance().getAudioForText(word.Examples || word.English);
        if (audio instanceof Error) throw audio;

        const audioURL = await GoogleCloudStorage.getInstance().uploadAudio(
            audio,
            `${word._id}.ogg`,
            this.logger,
        );
        word.AudioURL = audioURL;
      } else {
        word.AudioURL = existingWord.AudioURL;
      }

      if (word.ImageURL && word.ImageURL !== existingWord.ImageURL) {
        if (!word.ImageURL.includes(process.env.GOOGLE_CLOUD_STORAGE_BUCKET!)) {
          const imageResponse = await this.fetchRemoteImage(word.ImageURL);
          if (imageResponse instanceof Error) throw imageResponse;
          if (imageResponse.statusCode !== 200) {
            throw new Error(`Failed to fetch image: status ${imageResponse.statusCode}`);
          }

          const contentType = imageResponse.headers['content-type'] || 'image/jpeg';
          const extension = MIME_TYPES_TO_EXTENSION[contentType] || 'jpeg';
          const finalImageUrl = await GoogleCloudStorage.getInstance().uploadImage(
              imageResponse,
              `${word._id}.${extension}`,
              this.logger,
          );

          if (existingWord.ImageURL) {
            await GoogleCloudStorage.getInstance().deleteFile(existingWord.ImageURL, this.logger);
          }

          word.ImageURL = finalImageUrl;
        }
      }

      const result = await updateWord(user._id, word, this.logger);
      if (result instanceof Error) throw result;
    } catch (err) {
      this.logger.error({err}, 'Transactional editWord failed');
      return err instanceof Error ? err : new Error(String(err));
    }
  }

  async deleteWord(
      chatID: number,
      wordID: string,
  ): Promise<void | Error> {
    const user = await getUserByChatID(chatID, this.logger);
    if (user instanceof Error) return user;
    if (!user) return new Error(`User not found for chatID: ${chatID}`);

    const existingWord = await getWordByID(wordID, this.logger);
    if (existingWord instanceof Error) return existingWord;
    if (!existingWord) return;

    try {
      if (existingWord.AudioURL) {
        await GoogleCloudStorage.getInstance().deleteFile(existingWord.AudioURL, this.logger);
      }
      if (existingWord.ImageURL) {
        await GoogleCloudStorage.getInstance().deleteFile(existingWord.ImageURL, this.logger);
      }

      const result = await deleteWord(wordID, this.logger);
      return result === null ? undefined : result;
    } catch (err) {
      this.logger.error({err}, 'Transactional deleteWord failed');
      return err instanceof Error ? err : new Error(String(err));
    }
  }
}
