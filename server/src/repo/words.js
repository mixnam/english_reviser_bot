const {ObjectId} = require('mongodb');
const {getClient} = require('./repo');
const {executionTime} = require('../utils');

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
 * @property {string} Examples
 * @property {Progress} Progress
 * @property {Date} 'Last Revised'
 */


/**
 * @param {string} userID
 * @return {Promise<(Word|null)>}
 */
const getRandomWordByUserIDForRevise = executionTime(
    'getRandomWordByUserIDForRevise',
    async (userID) => {
      const client = await getClient();
      const db = client.db('englishbot');
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
      return await result.next();
    });

/**
 * @param {string} userID
 * @return {Promise<(Word|null)>}
 */
const getRandomWordByUserIDForLearn = executionTime(
    'getRandomWordByUserIDForLearn',
    async (userID) => {
      const client = await getClient();
      const db = client.db('englishbot');
      const words = db.collection(WORD_COLLECTION_NAME);

      const lastRevisedThreshhold = new Date();
      lastRevisedThreshhold.setDate(lastRevisedThreshhold.getDate() - 1);
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
      return await result.next();
    });

/**
 * @param {string} wordID
 * @param {Progress} progress
 * @return {Promise<Error|null>}
 */
const setWordProgress = executionTime(
    'setWordProgress',
    async (wordID, progress) => {
      const client = await getClient();
      const db = client.db('englishbot');
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
 * @return {Promis<Word|null|Error>}
 */
const getWordByID = executionTime(
    'getWordByID',
    async (wordID) => {
      const client = await getClient();
      const db = client.db('englishbot');
      const words = db.collection(WORD_COLLECTION_NAME);

      try {
        return await words.findOne(
            {_id: new ObjectId(wordID)},
        );
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

module.exports = {
  ProgressOrder,
  Progress,
  getWordByID,
  getRandomWordByUserIDForRevise,
  getRandomWordByUserIDForLearn,
  setWordProgress,
  setWordAsRevisedByWordID,
  setWordAsForgottenByWordID,
};
