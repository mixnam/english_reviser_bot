// eslint-disable-next-line
const {ObjectId, Binary, AggregationCursor, FindCursor} = require('mongodb');
const {getDb} = require('./repo');
const {executionTime} = require('../utils');
const levenshtein = require('js-levenshtein');

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
 * @typedef Word
 * @type {object}
 * @property {string} _id
 * @property {string} userID
 * @property {string} English
 * @property {string} Translation
 * @property {string|undefined} Examples
 * @property {string} Progress
 * @property {Uint8Array|undefined} Audio
 * @property {string|undefined} TelegramAudioID
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

const addNewWord = executionTime(
    'addNewWord',
    /**
     * @param {string} userID
     * @param {Word} word
     * @return {Promise<Error|string>}
     */
    async (userID, word) => {
      const db = await getDb();
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
     * @return {Promise<(Word|null)>}
     */
    async (userID) => {
      const db = await getDb();
      const words = db.collection(WORD_COLLECTION_NAME);

      const lastRevisedThreshhold = new Date();
      lastRevisedThreshhold.setDate(lastRevisedThreshhold.getDate() - 14);
      /**
       * @type {AggregationCursor<WordDTO>}
       */
      const result = words.aggregate([
        {
          $match: {
            userID,
            'Progress': Progress.Learned,
            'Last Revised': {
              $lt: lastRevisedThreshhold,
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
     * @return {Promise<(Word|null)>}
     */
    async (userID) => {
      const db = await getDb();
      const words = db.collection(WORD_COLLECTION_NAME);

      // Every yesterday word
      const lastRevisedThreshhold = new Date();
      lastRevisedThreshhold.setHours(0, 0, 0, 0);

      /**
       * @type {AggregationCursor<WordDTO>}
       */
      const result = words.aggregate([
        {
          $match: {
            userID,
            'Progress': {
              $in: [
                Progress.HaveProblems,
                Progress.NeedToRepeat,
                Progress.ActiveLearning,
                Progress.HaveToPayAttention,
              ],
            },
            'Last Revised': {
              $lt: lastRevisedThreshhold,
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

const setWordProgress = executionTime(
    'setWordProgress',
    /**
     * @param {string} wordID
     * @param {Progress} progress
     * @return {Promise<Error|null>}
     */
    async (wordID, progress) => {
      const db = await getDb();
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
     * @return {Promise<Error|null>}
     */
    async (wordID, audioID) => {
      const db = await getDb();
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

const getWordByID = executionTime(
    'getWordByID',
    /**
     * @param {string} wordID
     * @return {Promise<Word|null|Error>}
     */
    async (wordID) => {
      const db = await getDb();
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
     * @return {Promise<Word|null|Error>}
     */
    async (text) => {
      const db = await getDb();
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
     * @return {Promise<Error|null>}
     */
    async (wordID) => {
      const result = await setWordProgress(wordID, Progress.Learned);
      if (result !== null) {
        return new Error(`[repo][setWordAsRevisedByWordID] - ${result}`);
      }
      return null;
    });

const setWordAsForgottenByWordID = executionTime(
    'setWordAsForgottenByWordID',
    /**
     * @param {string} wordID
     * @return {Promise<Error|null>}
     */
    async (wordID) => {
      const result = await setWordProgress(wordID, Progress.HaveProblems);
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
     *
     * @return {Promise<Error|Array<{English: string}>>}
     */
    async (newWord, userID) => {
      const db = await getDb();
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


module.exports = {
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
};
