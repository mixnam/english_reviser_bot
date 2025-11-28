// eslint-disable-next-line
import {ObjectId, Binary, AggregationCursor, FindCursor} from 'mongodb';
import levenshtein from 'js-levenshtein';

import {getDb} from './repo.js';
import {executionTime, minusDaysFromNow} from './utils.js';

const WORD_COLLECTION_NAME = 'english_words';

const Progress = {
  HaveProblems: 'Have problems',
  NeedToRepeat: 'Need to repeat',
  HaveToPayAttention: 'Have to pay attention',
  ActiveLearning: 'Active learning',
  Learned: 'Learned',
};

const ProgressOrder = [
  Progress.HaveProblems,
  Progress.HaveToPayAttention,
  Progress.NeedToRepeat,
  Progress.ActiveLearning,
  Progress.Learned,
];

/**
 * @type {Record<Progress[keyof Progress], number>}
 */
const ProgressTimeSpace = {
  [Progress.HaveProblems]: 0,
  [Progress.HaveToPayAttention]: 1,
  [Progress.NeedToRepeat]: 3,
  [Progress.ActiveLearning]: 9,
  [Progress.Learned]: 27,
};

/**
 * @typedef Word
 * @type {object}
 * @property {string} _id
 * @property {string} userID
 * @property {string} English
 * @property {string} Translation
 * @property {string} [Examples]
 * @property {string} Progress
 * @property {Uint8Array} [Audio]
 * @property {string} [TelegramAudioID]
 * @property {string} [TelegramPictureID]
 * @property {string} [PictureFileName]
 * @ts-ignore
 * @property {Date} 'Last Revised'
 */

/**
 * @typedef WordDTO
 * @type {object}
 * @property {ObjectId} _id
 * @property {string} userID
 * @property {string} English
 * @property {string} Translation
 * @property {string|undefined} Examples
 * @property {string} Progress
 * @property {Binary|undefined} Audio
 * @property {string|undefined} TelegramAudioID
 * @property {string} [TelegramPictureID]
 * @property {string} [PictureFileName]
 * @ts-ignore
 * @property {Date} 'Last Revised'
 */

/**
 * @param {WordDTO} wordDto
 * @return {Word}
 */
const mapWord = (wordDto) => {
  return {
    ...wordDto,
    _id: wordDto._id.toString(),
    Audio: wordDto.Audio ?
      Buffer.from(wordDto.Audio.toString('base64'), 'base64') :
      undefined,
  };
};

const updateWord = executionTime('updateWord',
    /**
     * @param {string} userID
     * @param {Word} word
     * @param {import('./utils.js').Logger} logger
     * @return {Promise<Error|null>}
     */
    async (userID, word, logger) => {
      const db = await getDb(logger);
      const words = db.collection(WORD_COLLECTION_NAME);

      try {
        await words.updateOne({
          _id: new ObjectId(word._id),
          userID: userID,
        }, {
          $set: {
            English: word.English,
            Translation: word.Translation,
            Examples: word.Examples,
            Audio: word.Audio,
            TelegramAudioID: undefined,
          },
        });
        return null;
      } catch (err) {
        return new Error(`[repo][updateWord] - ${err}`);
      }
    });

const addNewWord = executionTime(
    'addNewWord',
    /**
     * @param {string} userID
     * @param {Word} word
     * @param {import('./utils.js').Logger} logger
     * @return {Promise<Error|string>}
     */
    async (userID, word, logger) => {
      const db = await getDb(logger);
      const words = db.collection(WORD_COLLECTION_NAME);

      try {
        const inserted = await words.insertOne({
          ...word,
          _id: new ObjectId(word._id),
          userID,
        });
        return inserted.insertedId.toString();
      } catch (err) {
        return new Error(`[repo][addNewWord] - ${err}`);
      }
    });


const getRandomWordByUserIDForRevise = executionTime(
    'getRandomWordByUserIDForRevise',
    /**
     * @param {string} userID
     * @param {import('./utils.js').Logger} logger
     * @return {Promise<(Word|null)>}
     */
    async (userID, logger) => {
      const db = await getDb(logger);
      const words = db.collection(WORD_COLLECTION_NAME);

      /**
       * @type {AggregationCursor<WordDTO>}
       */
      const result = words.aggregate([
        {
          $match: {
            userID,
            'Progress': Progress.Learned,
            'Last Revised': {
              $lt: minusDaysFromNow(ProgressTimeSpace[Progress.Learned]),
            },
          },
        },
        {
          $sample: {
            size: 1,
          },
        },
      ]);

      const wordDto = await result.next();

      return wordDto ? mapWord(wordDto) : null;
    });

const getRandomWordByUserIDForLearn = executionTime(
    'getRandomWordByUserIDForLearn',
    /**
     * @param {string} userID
     * @param {import('./utils.js').Logger} logger
     * @return {Promise<(Word|null)>}
     */
    async (userID, logger) => {
      const db = await getDb(logger);
      const words = db.collection(WORD_COLLECTION_NAME);

      /**
       * @type {AggregationCursor<WordDTO>}
       */
      const result = words.aggregate([
        {
          $match: {
            $or: [
              {
                userID,
                'Progress': Progress.HaveProblems,
                'Last Revised': {
                  $lt: minusDaysFromNow(ProgressTimeSpace[Progress.HaveProblems]),
                },
              },
              {
                userID,
                'Progress': Progress.HaveToPayAttention,
                'Last Revised': {
                  $lt: minusDaysFromNow(ProgressTimeSpace[Progress.HaveToPayAttention]),
                },
              },
              {
                userID,
                'Progress': Progress.NeedToRepeat,
                'Last Revised': {
                  $lt: minusDaysFromNow(ProgressTimeSpace[Progress.NeedToRepeat]),
                },
              },
              {
                userID,
                'Progress': Progress.ActiveLearning,
                'Last Revised': {
                  $lt: minusDaysFromNow(ProgressTimeSpace[Progress.ActiveLearning]),
                },
              },
            ],
          },
        },
        {
          $sample: {
            size: 1,
          },
        },
      ]);

      const wordDto = await result.next();

      return wordDto ? mapWord(wordDto) : null;
    });

const setWordProgress = executionTime(
    'setWordProgress',
    /**
     * @param {string} wordID
     * @param {string} progress
     * @param {import('./utils.js').Logger} logger
     * @return {Promise<Error|null>}
     */
    async (wordID, progress, logger) => {
      const db = await getDb(logger);
      const words = db.collection(WORD_COLLECTION_NAME);

      try {
        await words.findOneAndUpdate(
            {_id: new ObjectId(wordID)},
            {
              $set: {
                'Progress': progress,
                'Last Revised': new Date(),
              },
            },
        );
        return null;
      } catch (err) {
        return new Error(`[repo][setWordProgress] - ${err}`);
      }
    });

const setWordTelegramAudioID = executionTime(
    'setWordTelegramAudioID',
    /**
     * @param {string} wordID
     * @param {string} audioID
     * @param {import('./utils.js').Logger} logger
     * @return {Promise<Error|null>}
     */
    async (wordID, audioID, logger) => {
      const db = await getDb(logger);
      const words = db.collection(WORD_COLLECTION_NAME);

      try {
        await words.findOneAndUpdate(
            {_id: new ObjectId(wordID)},
            {
              $set: {
                'TelegramAudioID': audioID,
              },
            },
        );
        return null;
      } catch (err) {
        return new Error(`[repo][setWordTelegramAudioID] - ${err}`);
      }
    });

const setWordTelegramPictureID = executionTime(
    'setWordPicture',
    /**
     * @param {string} wordID
     * @param {string} telegramPictureID
     * @param {import('./utils.js').Logger} logger
     * @return {Promise<Error|null>}
     */
    async (wordID, telegramPictureID, logger) => {
      const db = await getDb(logger);
      const words = db.collection(WORD_COLLECTION_NAME);

      try {
        await words.findOneAndUpdate(
            {_id: new ObjectId(wordID)},
            {
              $set: {
                'TelegramPictureID': telegramPictureID,
              },
            },
        );
        return null;
      } catch (err) {
        return new Error(`[repo][setWordTelegramPictureID] - ${err}`);
      }
    });

const setWordPictureName = executionTime(
    'setWordPictureName',
    /**
     * @param {string} wordID
     * @param {string} pictureName
     * @param {import('./utils.js').Logger} logger
     * @return {Promise<Error|null>}
     */
    async (wordID, pictureName, logger) => {
      const db = await getDb(logger);
      const words = db.collection(WORD_COLLECTION_NAME);

      try {
        await words.findOneAndUpdate(
            {_id: new ObjectId(wordID)},
            {
              $set: {
                'PictureFileName': pictureName,
              },
            },
        );
        return null;
      } catch (err) {
        return new Error(`[repo][setWordPictureName] - ${err}`);
      }
    });


const getWordByID = executionTime(
    'getWordByID',
    /**
     * @param {string} wordID
     * @param {import('./utils.js').Logger} logger
     * @return {Promise<Word|null|Error>}
     */
    async (wordID, logger) => {
      const db = await getDb(logger);
      const words = db.collection(WORD_COLLECTION_NAME);

      try {
        /**
         * hack, to map to WordDTO
         * @type {any}
         */
        const wordDto = await words.findOne({
          _id: new ObjectId(wordID),
        });
        return wordDto ? mapWord(wordDto) : null;
      } catch (err) {
        return new Error(`[repo][getWordByID] - ${err}`);
      }
    });

const getWordByText = executionTime(
    'getWordByText',
    /**
     * @param {string} text
     * @param {import('./utils.js').Logger} logger
     * @return {Promise<Word|null|Error>}
     */
    async (text, logger) => {
      const db = await getDb(logger);
      const words = db.collection(WORD_COLLECTION_NAME);

      try {
        // enchancment add text index
        const wordDto = /** @type {WordDTO} */ (await words.findOne({English: text}));
        return wordDto ? mapWord(wordDto) : null;
      } catch (err) {
        return new Error(`[repo][getWordByID] - ${err}`);
      }
    });

const setWordAsRevisedByWordID = executionTime(
    'setWordAsRevisedByWordID',
    /**
     * @param {string} wordID
     * @param {import('./utils.js').Logger} logger
     * @return {Promise<Error|null>}
     */
    async (wordID, logger) => {
      const result = await setWordProgress(wordID, Progress.Learned, logger);
      if (result !== null) {
        return new Error(`[repo][setWordAsRevisedByWordID] - ${result}`);
      }
      return null;
    });

const setWordAsForgottenByWordID = executionTime(
    'setWordAsForgottenByWordID',
    /**
     * @param {string} wordID
     * @param {import('./utils.js').Logger} logger
     * @return {Promise<Error|null>}
     */
    async (wordID, logger) => {
      const result = await setWordProgress(wordID, Progress.HaveProblems, logger);
      if (result !== null) {
        return new Error(`[repo][setWordAsForgottenByWordID] - ${result}`);
      }
      return null;
    });

/**
 * @param {string} newWord
 * @param {string} userID
 *
 * @return {Promise<Error|Array<{English: string}>>}
 */
const getSpelcheckSuggestions = executionTime(
    'getSpelcheckSuggestions',
    /**
     * @param {string} newWord
     * @param {string} userID
     * @param {import('./utils.js').Logger} logger
     *
     * @return {Promise<Error|Array<{English: string}>>}
     */
    async (newWord, userID, logger) => {
      const db = await getDb(logger);
      const words = db.collection(WORD_COLLECTION_NAME);

      const result = words.find({userID}, {
        projection: {
          English: 1,
        },
      });

      /**
         * Let's just assume that the longest word in user input string
         * is the word user want to add
         *
         * @param {string} word
         * @return {string}
         */
      const cleanWord = (word) => word
          .toLowerCase()
          .trim()
          .split(' ')
          .reduce((acc, w) =>
              acc.length < w.length ? w : acc
          , '');

      const newWordCleaned = cleanWord(newWord);

      /**
       * @type {Array<{English: string}>}
       */
      const suggestions = [];
      try {
        for await (const word of result) {
          if (
            levenshtein(cleanWord(word.English), newWordCleaned) <
              (newWordCleaned.length > 6 ? 2 : 1)
          ) {
            suggestions.push(
                /** @type {{English: string}} */(/** @type {unknown}*/ (word)),
            );
          }
        }
        return suggestions;
      } catch (err) {
        return new Error(`[repo][getSpelcheckSuggestions] - ${err}`);
      }
    });


export {
  ProgressOrder,
  Progress,
  addNewWord,
  getWordByID,
  getWordByText,
  getRandomWordByUserIDForRevise,
  getRandomWordByUserIDForLearn,
  getSpelcheckSuggestions,
  setWordProgress,
  setWordTelegramAudioID,
  setWordAsRevisedByWordID,
  setWordAsForgottenByWordID,
  setWordTelegramPictureID,
  setWordPictureName,
  updateWord,
};
