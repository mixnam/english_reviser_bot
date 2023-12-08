const {getDb} = require('./repo');
const {executionTime} = require('../utils');
const {ObjectId} = require('mongodb');

/**
 * @typedef State
 * @type {object}
 * @property {Partial<import('./words').Word>} [newWord]
 * @property {Array<Pick<import('./words').Word, 'English'>>} [suggestions]
 * @property {import('./words').Word} wordToStudyAgain
 */

/**
 * @typedef User
 * @type {object}
 * @property {string} _id
 * @property {number|string} chatID
 * @property {string|undefined} username
 * @property {string|undefined} firstName
 * @property {string|undefined} lastName
 * @property {State} state
 * @property {number|null} flowID
 * @property {string|null} stepID
 */

const addNewUser = executionTime(
    'addNewUser',
    /**
     * @param {Omit<User, '_id'>} user
     * @return {Promise<string|Error>}
     */
    async (user) => {
      const db = await getDb();
      const users = db.collection('users');

      const result = await getUserByChatID(user.chatID);
      if (result instanceof Error) {
        return new Error(
            `[repo][addNewUser]: cant't verify if user exists - ${result}`,
        );
      }
      if (result !== null) {
        return result._id;
      }

      try {
        const result = await users.insertOne(user);
        return /** @type {string} */ (/** @type {unknown} */ (result.insertedId));
      } catch (err) {
        return new Error(`[repo][addNewUser]: can't insert new user - ${err}`);
      }
    });

const getUserByChatID = executionTime(
    'getUserByChatID',
    /**
     * @param {number|string} chatID
     * @returns {Promise<User|Error>}
     */
    async (chatID) => {
      const db = await getDb();
      const users = db.collection('users');
      try {
        const user = /** @type{User} */ (/** @type {unknown} */ (await users.findOne({chatID: chatID})));
        return user;
      } catch (err) {
        return new Error(
            `[repo][getUserByChatID]: can't retrieve user by chatID ${chatID} - ${err}`,
        );
      }
    });

/**
 * @param {string} userID
 * @param {Object} state
 * @return {Promise<Error|null>}
 */
const setUserState = executionTime(
    'setUserState',
    async (userID, state) => {
      const db = await getDb();
      const users = db.collection('users');

      try {
        await users.findOneAndUpdate({
          _id: new ObjectId(userID),
        }, {
          $set: {
            state,
          },
        });
        return null;
      } catch (err) {
        return new Error(
            `[repo][setUserState]: can't update user state - ${err}`,
        );
      }
    });

/**
 * @param {string} userID
 * @param {Object} stepID
 * @return {Promise<Error|null>}
 */
const setUserStepID = executionTime(
    'setUserStepID',
    async (userID, stepID) => {
      const db = await getDb();
      const users = db.collection('users');

      try {
        await users.findOneAndUpdate({
          _id: new ObjectId(userID),
        }, {
          $set: {
            stepID,
          },
        });
        return null;
      } catch (err) {
        return new Error(
            `[repo][setUserStepID]: can't update user stepID - ${err}`,
        );
      }
    });


module.exports = {
  addNewUser,
  getUserByChatID,
  setUserState,
  setUserStepID,
};
