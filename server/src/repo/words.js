// eslint-disable-next-line
const {ObjectId, Binary} = require('mongodb');
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
 * @property {Progress} Progress
 * @property {Uint8Array|undefined} Audio
 * @property {string|undefined} TelegramAudioID
 * @property {Date} 'Last Revised'
 */

/**
 * @typedef WordDTO
 * @type {object}
 * @property {string} _id
 * @property {string} userID
 * @property {string} English
 * @property {string} Translation
 * @property {string|undefined} Examples
 * @property {Progress} Progress
 * @property {Binary|undefined} Audio
 * @property {string|undefined} TelegramAudioID
 * @property {Date} 'Last Revised'
 */

/**
 * @param {WordDTO} wordDto
 * @return {Word}
 */
const mapWord = (wordDto) => {
  return {
    ...wordDto,
    Audio: wordDto.Audio ?
      Buffer.from(wordDto.Audio.toString('base64'), 'base64') :
      undefined,
  };
};

/**
 * @param {string} userID
 * @param {Word} word
 * @return {Promise<Error|string>}
 */
const addNewWord = executionTime(
    'addNewWord',
    async (userID, word) => {
      const db = await getDb();
      const words = db.collection(WORD_COLLECTION_NAME);

      try {
        const inserted = await words.insertOne({
          userID,
          ...word,
        });
        return inserted.insertedId;
      } catch (err) {
        return new Error(`[repo][addNewWord] - ${err}`);
      }
    });


/**
 * @param {string} userID
 * @return {Promise<(Word|null)>}
 */
const getRandomWordByUserIDForRevise = executionTime(
    'getRandomWordByUserIDForRevise',
    async (userID) => {
      const db = await getDb();
      const words = db.collection(WORD_COLLECTION_NAME);

      const lastRevisedThreshhold = new Date();
      lastRevisedThreshhold.setDate(lastRevisedThreshhold.getDate() - 14);
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

      if (!(await result.hasNext())) {
        return null;
      }
      return mapWord(await result.next());
    });

/**
 * @param {string} userID
 * @return {Promise<(Word|null)>}
 */
const getRandomWordByUserIDForLearn = executionTime(
    'getRandomWordByUserIDForLearn',
    async (userID) => {
      const db = await getDb();
      const words = db.collection(WORD_COLLECTION_NAME);

      // Every yesterday word
      const lastRevisedThreshhold = new Date();
      lastRevisedThreshhold.setHours(0, 0, 0, 0);

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

      if (!(await result.hasNext())) {
        return null;
      }
      return mapWord(await result.next());
    });

/**
 * @param {string} wordID
 * @param {Progress} progress
 * @return {Promise<Error|null>}
 */
const setWordProgress = executionTime(
    'setWordProgress',
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

/**
 * @param {string} wordID
 * @param {string} audioID
 * @return {Promise<Error|null>}
 */
const setWordTelegramAudioID = executionTime(
    'setWordTelegramAudioID',
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

/**
 * @param {string} wordID
 * @return {Promis<Word|null|Error>}
 */
const getWordByID = executionTime(
    'getWordByID',
    async (wordID) => {
      const db = await getDb();
      const words = db.collection(WORD_COLLECTION_NAME);

      try {
        return mapWord(await words.findOne(
            {_id: new ObjectId(wordID)},
        ));
      } catch (err) {
        return new Error(`[repo][getWordByID] - ${err}`);
      }
    });

/**
 * @param {string} text
 * @return {Promis<Word|null|Error>}
 */
const getWordByText = executionTime(
    'getWordByText',
    async (text) => {
      const db = await getDb();
      const words = db.collection(WORD_COLLECTION_NAME);

      try {
        // enchancment add text index
        return mapWord(await words.findOne(
            {English: text},
        ));
      } catch (err) {
        return new Error(`[repo][getWordByID] - ${err}`);
      }
    });

/**
 * @param {string} wordID
 * @return {Promis<Error|null>}
 */
const setWordAsRevisedByWordID = executionTime(
    'setWordAsRevisedByWordID',
    async (wordID) => {
      const result = await setWordProgress(wordID, Progress.Learned);
      if (result !== null) {
        return new Error(`[repo][setWordAsRevisedByWordID] - ${result}`);
      }
      return null;
    });

/**
 * @param {string} wordID
 * @return {Promis<Error|null>}
 */
const setWordAsForgottenByWordID = executionTime(
    'setWordAsForgottenByWordID',
    async (wordID) => {
      const result = await setWordProgress(wordID, Progress.HaveProblems);
      if (result !== null) {
        return new Error(`[repo][setWordAsForgottenByWordID] - ${err}`);
      }
      return null;
    });

/**
 * @param {string} word
 * @param {string} userID
 *
 * @return {Promise<Error|Array<{English: string}>>}
 */
const getSpelcheckSuggestions = executionTime(
    'getSpelcheckSuggestions',
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

      const suggestions = [];
      try {
        for await (const word of result) {
          console.log(word);
          if (
            levenshtein(cleanWord(word.English), newWordCleaned) <
              (newWordCleaned.length > 6 ? 2 : 1)
          ) {
            suggestions.push(word);
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
