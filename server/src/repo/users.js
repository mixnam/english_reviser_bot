const {getDb} = require('./repo');
const {executionTime} = require('./utils');
const {ObjectId} = require('mongodb');

/**
 * @typedef State
 * @type {object}
 * @property {Partial<import('./words').Word>} [newWord]
 * @property {Array<Pick<import('./words').Word, 'English'>>} [suggestions]
 * @property {string} [suggestedExample]
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
     * @param {import('./utils').Logger} logger
     * @return {Promise<string|Error>}
     */
    async (user, logger) => {
      const db = await getDb(logger);
      const users = db.collection('users');

      const result = await getUserByChatID(user.chatID, logger);
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
     * @param {import('./utils').Logger} logger
     * @returns {Promise<User|Error>}
     */
    async (chatID, logger) => {
      const db = await getDb(logger);
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

const setUserState = executionTime(
    'setUserState',
    /**
     * @param {string} userID
     * @param {Object} state
     * @param {import('./utils').Logger} logger
     * @return {Promise<Error|null>}
     */
    async (userID, state, logger) => {
      const db = await getDb(logger);
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

const setUserStepID = executionTime(
    'setUserStepID',
    /**
     * @param {string} userID
     * @param {Object} stepID
     * @param {import('./utils').Logger} logger
     * @return {Promise<Error|null>}
     */
    async (userID, stepID, logger) => {
      const db = await getDb(logger);
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
