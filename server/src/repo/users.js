const {getClient} = require('./repo');
const {executionTime} = require('../utils');

/**
 * @typedef State
 * @type{null}
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
 * @property {number|null} stepID
 */

/**
 * @param {User} user
 * @return {Promise<number|Error>}
 */
const addNewUser = executionTime(
    'addNewUser',
    async (user) => {
      const client = await getClient();
      const db = client.db('englishbot');
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
        return result.insertedId;
      } catch (err) {
        return new Error(`[repo][addNewUser]: can't insert new user - ${err}`);
      }
    });

/**
 * @param {number|string} chatID
 * @return {Promise<User|null|Error>}
 */
const getUserByChatID = executionTime(
    'getUserByChatID',
    async (chatID) => {
      const client = await getClient();
      const db = client.db('englishbot');
      const users = db.collection('users');
      try {
        const user = await users.findOne({chatID: chatID});
        return user;
      } catch (err) {
        return new Error(
            `[repo][getUserByChatID]: can't retrieve user by chatID ${chatID} - ${err}`,
        );
      }
    });


module.exports = {
  addNewUser,
  getUserByChatID,
};
