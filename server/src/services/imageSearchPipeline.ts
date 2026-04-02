import type {Logger} from 'pino';
import type {GoogleImageSearchResult} from './googleImage.js';
import {getInstance as getGoogleImageServiceInstance} from './googleImage.js';

const CYRILLIC_RE = /\p{Script=Cyrillic}/u;
const LATIN_RE = /\p{Script=Latin}/u;

export const buildDeterministicImageSearchQuery = (word: string, translation: string): string => {
  const cleanWord = word.trim();
  const cleanTranslation = translation.trim();
  const translationIsCyrillic = CYRILLIC_RE.test(cleanTranslation);
  const translationIsLatin = LATIN_RE.test(cleanTranslation) && !translationIsCyrillic;
  const primaryTerm = translationIsLatin ? cleanTranslation : cleanWord;

  return `${primaryTerm} illustration`.trim();
};

export const searchImagesForQuery = async (
    query: string,
    logger: Logger,
    offset: number = 0,
    pageSize: number = 5,
): Promise<GoogleImageSearchResult[] | Error> => {
  const googleStart = offset + 1;
  const googleNum = Math.min(Math.max(pageSize, 1), 10);
  const google = getGoogleImageServiceInstance();

  return google.searchImages(query, logger, googleStart, googleNum);
};
