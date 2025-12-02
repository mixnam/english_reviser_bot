import {ObjectId} from 'mongodb';

import {getDb} from './repo.js';
import {executionTime} from './utils.js';
import {Logger} from 'pino';
import {Word} from './words.js';

export type State = {
  newWord?: Partial<Word>;
  suggestions?: Array<Pick<Word, 'English'>>;
  suggestedExample?: string;
  wordToStudyAgain?: Word;
}

export type User = {
  _id: string;
  chatID: number | string;
  username: string | undefined;
  firstName: string | undefined;
  lastName: string | undefined;
  state: State | null;
  flowID: number | null;
  stepID: string | null;
}

const addNewUser = executionTime(
    'addNewUser',
    async (user: Omit<User, '_id'>, logger: Logger): Promise<string | Error> => {
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
        return result.insertedId.toString();
      } catch (err) {
        return new Error(`[repo][addNewUser]: can't insert new user - ${err}`);
      }
    });

const getUserByChatID = executionTime(
    'getUserByChatID',
    async (chatID: number | string, logger: Logger): Promise<User | Error | null> => {
      const db = await getDb(logger);
      const users = db.collection('users');
      try {
        const user = await users.findOne({chatID: chatID});
        return user as unknown as User;
      } catch (err) {
        return new Error(
            `[repo][getUserByChatID]: can't retrieve user by chatID ${chatID} - ${err}`,
        );
      }
    });

const setUserState = executionTime(
    'setUserState',
    async (userID: string, state: State, logger: Logger): Promise<Error | null> => {
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
    async (userID: string, stepID: string, logger: Logger): Promise<Error | null> => {
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


export {
  addNewUser,
  getUserByChatID,
  setUserState,
  setUserStepID,
};
