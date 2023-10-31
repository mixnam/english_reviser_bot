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
    'getRandomWordForRevise',
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
      const client = await getClient();
      const db = client.db('englishbot');
      const words = db.collection(WORD_COLLECTION_NAME);

      try {
        await words.findOneAndUpdate(
            {_id: new ObjectId(wordID)},
            {
              $set: {
                'Last Revised': new Date(),
              },
            },
        );
        return null;
      } catch (err) {
        return new Error(`[repo][setWordAsRevisedByWordID] - ${err}`);
      }
    });

/**
 * @param {string} wordID
 * @return {Promis<Error|null>}
 */
const setWordAsForgottenByWordID = executionTime(
    'setWordAsForgottenByWordID',
    async (wordID) => {
      const client = await getClient();
      const db = client.db('englishbot');
      const words = db.collection(WORD_COLLECTION_NAME);

      try {
        await words.findOneAndUpdate(
            {_id: new ObjectId(wordID)},
            {
              $set: {
                'Progress': Progress.HaveProblems,
                'Last Revised': new Date(),
              },
            },
        );
        return null;
      } catch (err) {
        return new Error(`[repo][setWordAsForgottenByWordID] - ${err}`);
      }
    });

module.exports = {
  ProgressOrder,
  Progress,
  getWordByID,
  getRandomWordByUserIDForRevise,
  setWordAsRevisedByWordID,
  setWordAsForgottenByWordID,
};
