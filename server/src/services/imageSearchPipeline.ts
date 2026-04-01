import type {Logger} from 'pino';
import type {GoogleImageSearchResult} from './googleImage.js';
import {getInstance as getGoogleImageServiceInstance} from './googleImage.js';

export type RankedImageSearchCandidate = GoogleImageSearchResult & {
  query: string;
  rankHint: number;
};

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'de', 'do', 'da', 'dos', 'das', 'o', 'os', 'as',
  'um', 'uma', 'and', 'or', 'of', 'for', 'to', 'in',
]);

const CYRILLIC_RE = /\p{Script=Cyrillic}/u;
const LATIN_RE = /\p{Script=Latin}/u;

export const normalizeSearchTokens = (...values: string[]): string[] => {
  return values
      .flatMap((value) => value
          .toLowerCase()
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .split(/[^\p{L}\p{N}]+/u),
      )
      .map((token) => token.trim())
      .filter((token) => token.length >= 2 && !STOP_WORDS.has(token));
};

export const buildDeterministicImageSearchQueries = (word: string, translation: string): string[] => {
  const cleanWord = word.trim();
  const cleanTranslation = translation.trim();
  const translationIsCyrillic = CYRILLIC_RE.test(cleanTranslation);
  const translationIsLatin = LATIN_RE.test(cleanTranslation) && !translationIsCyrillic;
  const primaryTerm = translationIsLatin ? cleanTranslation : cleanWord;
  const secondaryTerm = translationIsLatin ? cleanWord : cleanTranslation;

  return [
    `${primaryTerm} illustration`,
    `${primaryTerm} isolated`,
    secondaryTerm ? `${primaryTerm} ${secondaryTerm} illustration` : '',
  ].map((query) => query.trim()).filter((query, index, arr) => query && arr.indexOf(query) === index);
};

export const deterministicFallbackScore = (
    result: GoogleImageSearchResult,
    word: string,
    translation: string,
): number => {
  const haystack = [
    result.title,
    result.snippet,
    result.displayLink,
    result.contextLink,
  ].filter(Boolean).join(' ').toLowerCase();

  const tokens = normalizeSearchTokens(word, translation);
  let score = 0;

  for (const token of tokens) {
    if (haystack.includes(token)) score += 3;
  }

  const wordTokens = normalizeSearchTokens(word);
  const translationTokens = normalizeSearchTokens(translation);

  if (wordTokens.some((token) => haystack.includes(token))) score += 5;
  if (translationTokens.some((token) => haystack.includes(token))) score += 5;

  if (/illustration|photo|isolated|person|people|object/.test(haystack)) score += 2;
  if (/pinterest|facebook|instagram|tiktok|youtube|researchgate/.test(haystack)) score -= 5;
  if (/logo|icon|banner|poster|wallpaper|vector|stock|conjugation|grammar|vocabulary|worksheet|flashcard/.test(haystack)) score -= 4;

  const area = (result.width ?? 0) * (result.height ?? 0);
  if (area >= 200_000) score += 1;

  return score;
};

export const collectImageSearchCandidates = async (
    queries: string[],
    logger: Logger,
    offset: number = 0,
    pageSize: number = 5,
): Promise<RankedImageSearchCandidate[] | Error> => {
  const targetCount = offset + pageSize;
  const googleStart = Math.floor(offset / pageSize) * pageSize + 1;
  const googleNum = Math.min(Math.max(targetCount, 10), 10);
  const collected: RankedImageSearchCandidate[] = [];
  const seen = new Set<string>();
  const google = getGoogleImageServiceInstance();

  for (const query of queries) {
    const results = await google.searchImages(query, logger, googleStart, googleNum);
    if (results instanceof Error) return results;

    for (const [index, result] of results.entries()) {
      if (seen.has(result.url)) continue;
      seen.add(result.url);
      collected.push({
        ...result,
        query,
        rankHint: index,
      });
    }
  }

  return collected;
};

export const orderImageCandidates = (
    word: string,
    translation: string,
    candidates: RankedImageSearchCandidate[],
    rerankedUrls?: string[],
): string[] => {
  const fallbackOrdered = [...candidates]
      .sort((a, b) => {
        const scoreDiff = deterministicFallbackScore(b, word, translation) - deterministicFallbackScore(a, word, translation);
        if (scoreDiff !== 0) return scoreDiff;
        return a.rankHint - b.rankHint;
      })
      .map((result) => result.url);

  if (!rerankedUrls?.length) return fallbackOrdered;

  return [
    ...rerankedUrls,
    ...fallbackOrdered.filter((url) => !rerankedUrls.includes(url)),
  ];
};
