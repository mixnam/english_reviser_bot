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
import * as GoogleImageService from '../../services/googleImage.js';
import type {GoogleImageSearchResult} from '../../services/googleImage.js';
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

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'de', 'do', 'da', 'dos', 'das', 'o', 'os', 'as',
  'um', 'uma', 'and', 'or', 'of', 'for', 'to', 'in',
]);

const CYRILLIC_RE = /\p{Script=Cyrillic}/u;
const LATIN_RE = /\p{Script=Latin}/u;
const PORTUGUESE_VERB_ENDINGS = ['ar', 'er', 'ir'];

type ImageQueryCandidate = {subject: string; scene?: string; styleHint?: string};

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

  private normalizeSearchTokens(...values: string[]): string[] {
    return values
        .flatMap((value) => value
            .toLowerCase()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .split(/[^\p{L}\p{N}]+/u),
        )
        .map((token) => token.trim())
        .filter((token) => token.length >= 2 && !STOP_WORDS.has(token));
  }

  private buildDeterministicImageSearchQueries(word: string, translation: string): string[] {
    const cleanWord = word.trim();
    const cleanTranslation = translation.trim();
    const translationIsCyrillic = CYRILLIC_RE.test(cleanTranslation);
    const translationIsLatin = LATIN_RE.test(cleanTranslation) && !translationIsCyrillic;
    const primaryTerm = translationIsLatin ? cleanTranslation : cleanWord;
    const secondaryTerm = translationIsLatin ? cleanWord : cleanTranslation;
    const normalizedWord = cleanWord.toLowerCase();
    const normalizedPrimary = primaryTerm.toLowerCase();
    const isLikelyVerb = PORTUGUESE_VERB_ENDINGS.some((ending) => normalizedWord.endsWith(ending));
    const primaryGerund =
      translationIsLatin && normalizedPrimary.endsWith('e')
        ? `${primaryTerm.slice(0, -1)}ing`
        : translationIsLatin
          ? `${primaryTerm}ing`
          : '';

    const baseQueries = isLikelyVerb
      ? [
          primaryGerund ? `${primaryGerund} person` : '',
          primaryGerund ? `${primaryGerund} people` : '',
          `${primaryTerm} action illustration`,
          `${primaryTerm} illustration`,
        ]
      : [
          `${primaryTerm} illustration`,
          `${primaryTerm} isolated`,
        ];

    return [
      ...baseQueries,
      secondaryTerm ? `${primaryTerm} ${secondaryTerm} illustration` : '',
    ].filter((query, index, arr) => query && arr.indexOf(query) === index);
  }

  private buildPlannedImageSearchQueries(
      word: string,
      translation: string,
      intent: 'object' | 'action' | 'mixed' | 'unknown',
      candidates: ImageQueryCandidate[],
  ): string[] {
    const queries: string[] = [];
    const cleanWord = word.trim();
    const cleanTranslation = translation.trim();

    for (const candidate of candidates.slice(0, 3)) {
      const subject = candidate.subject.trim();
      const scene = candidate.scene?.trim();
      const style = candidate.styleHint?.trim();

      if (intent === 'action') {
        if (scene) queries.push(`${subject} ${scene}`);
        queries.push(`${subject} action illustration`);
      } else if (intent === 'mixed') {
        queries.push(`${subject} illustration`);
        if (scene) queries.push(`${subject} ${scene} illustration`);
      } else {
        queries.push(`${subject} illustration`);
        queries.push(`${subject} isolated`);
      }

      if (style) queries.push(`${subject} ${style}`);
      if (cleanTranslation && cleanTranslation !== subject) queries.push(`${subject} ${cleanTranslation} illustration`);
      if (cleanWord && cleanWord !== subject) queries.push(`${subject} ${cleanWord} illustration`);
    }

    return [...new Set(queries)].filter(Boolean).slice(0, 5);
  }

  private scoreImageResult(
      result: GoogleImageSearchResult,
      word: string,
      translation: string,
      query: string,
  ): number {
    const haystack = [
      result.title,
      result.snippet,
      result.displayLink,
      result.contextLink,
      query,
    ].filter(Boolean).join(' ').toLowerCase();

    const tokens = this.normalizeSearchTokens(word, translation);
    let score = 0;

    for (const token of tokens) {
      if (haystack.includes(token)) score += 3;
    }

    const wordTokens = this.normalizeSearchTokens(word);
    const translationTokens = this.normalizeSearchTokens(translation);

    if (wordTokens.some((token) => haystack.includes(token))) score += 5;
    if (translationTokens.some((token) => haystack.includes(token))) score += 5;

    if (/illustration|ilustracao|ilustração|action|people|person|conversation/.test(haystack)) score += 2;
    if (/pinterest|facebook|instagram|tiktok|youtube|researchgate/.test(haystack)) score -= 5;
    if (/logo|icon|banner|poster|wallpaper|vector|stock|conjugation|grammar|vocabulary/.test(haystack)) score -= 3;

    const area = (result.width ?? 0) * (result.height ?? 0);
    if (area >= 200_000) score += 1;

    return score;
  }

  async searchImages(word: string, translation: string, offset: number = 0): Promise<string[] | Error> {
    const deterministicQueries = this.buildDeterministicImageSearchQueries(word, translation);
    const planned = await OpenAIImageQueryPlanner.getInstance().plan(word, translation, this.logger);
    const plannedQueries = planned ? this.buildPlannedImageSearchQueries(word, translation, planned.intent, planned.candidates) : [];
    const queries = [...new Set([...plannedQueries, ...deterministicQueries])].slice(0, 5);
    const pageSize = 5;
    const targetCount = offset + pageSize;
    const googleStart = Math.floor(offset / pageSize) * pageSize + 1;
    const googleNum = Math.min(Math.max(targetCount, 10), 10);
    const collected: Array<GoogleImageSearchResult & {score: number}> = [];
    const seen = new Set<string>();

    for (const query of queries) {
      const results = await GoogleImageService.getInstance().searchImages(
          query,
          this.logger,
          googleStart,
          googleNum,
      );
      if (results instanceof Error) return results;

      for (const result of results) {
        if (seen.has(result.url)) continue;
        seen.add(result.url);
        collected.push({
          ...result,
          score: this.scoreImageResult(result, word, translation, query),
        });
      }
    }

    collected.sort((a, b) => b.score - a.score);

    this.logger.info({
      word,
      translation,
      offset,
      queries,
      plannerUsed: Boolean(planned),
      plannerConfidence: planned?.confidence ?? null,
      candidates: collected.slice(0, 15).map(({url, score, title, displayLink}) => ({url, score, title, displayLink})),
    }, 'Ranked image search candidates');

    return collected.slice(offset, offset + pageSize).map((result) => result.url);
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
  ): Promise<void | Error> {
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
