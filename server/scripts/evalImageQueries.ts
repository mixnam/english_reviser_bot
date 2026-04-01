import dotenv from 'dotenv';
import {pino} from 'pino';
import {getInstance as getGoogleImageServiceInstance} from '../src/services/googleImage.js';

dotenv.config({path: '.env.dev'});

const logger = pino({level: 'silent'});
const service = getGoogleImageServiceInstance();

const buildQueries = (word: string, translation: string): string[] => {
  const CYRILLIC_RE = /\p{Script=Cyrillic}/u;
  const LATIN_RE = /\p{Script=Latin}/u;
  const PORTUGUESE_VERB_ENDINGS = ['ar', 'er', 'ir'];

  const cleanWord = word.trim();
  const cleanTranslation = translation.trim();
  const translationIsCyrillic = CYRILLIC_RE.test(cleanTranslation);
  const translationIsLatin = LATIN_RE.test(cleanTranslation) && !translationIsCyrillic;
  const primaryTerm = translationIsLatin ? cleanTranslation : cleanWord;
  const secondaryTerm = translationIsLatin ? cleanWord : cleanTranslation;
  const normalizedWord = cleanWord.toLowerCase();
  const isLikelyVerb = PORTUGUESE_VERB_ENDINGS.some((ending) => normalizedWord.endsWith(ending));

  const baseQueries = isLikelyVerb
    ? [
        `${primaryTerm} action`,
        `${primaryTerm} person`,
        `${primaryTerm} people`,
        `${primaryTerm} illustration`,
      ]
    : [
        `${primaryTerm} illustration`,
        `${primaryTerm} object`,
        `${primaryTerm} photo`,
      ];

  return [
    ...baseQueries,
    secondaryTerm ? `${primaryTerm} ${secondaryTerm}` : '',
    secondaryTerm ? `${primaryTerm} ${secondaryTerm} illustration` : '',
  ].filter((query, index, arr) => query && arr.indexOf(query) === index);
};

const examples = [
  {word: 'falar', translation: 'speak'},
  {word: 'abrir', translation: 'open'},
  {word: 'correr', translation: 'run'},
  {word: 'mesa', translation: 'table'},
  {word: 'maçã', translation: 'apple'},
  {word: 'cachorro', translation: 'dog'},
  {word: 'feliz', translation: 'happy'},
  {word: 'grande', translation: 'big'},
];

for (const example of examples) {
  const queries = buildQueries(example.word, example.translation);
  console.log(`\n=== ${example.word} -> ${example.translation} ===`);
  console.log('queries:', queries);
  for (const query of queries.slice(0, 2)) {
    const result = await service.searchImages(query, logger, 1, 3);
    console.log(`\nQUERY: ${query}`);
    if (result instanceof Error) {
      console.log('ERROR:', result.message);
      continue;
    }
    for (const item of result.slice(0, 3)) {
      console.log('-', item.title || '(no title)');
      console.log('  ', item.url);
    }
  }
}
