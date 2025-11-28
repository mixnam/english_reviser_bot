// eslint-disable-next-line
import {MongoClient, ServerApiVersion, Db} from 'mongodb';

/** @type {Promise<MongoClient> | null} */
let clientPromise = null;
/** @type {Promise<Db> | null} */
let dbPromise = null;

/**
 * @param {import('./utils.js').Logger} logger
 * @return {Promise<MongoClient>}
 */
const getClient = async (logger) => {
  if (!process.env.MONGODB_URI) {
    throw new Error('There is not env MONGODB_URI');
  }

  if (!clientPromise) {
    const client = new MongoClient(process.env.MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });

    clientPromise = client.connect()
        .then((connectedClient) => {
          logger.info('MongoDB client connected');
          return connectedClient;
        })
        .catch((err) => {
          clientPromise = null;
          throw err;
        });
  } else {
    logger.info('Using existing client');
  }

  return clientPromise;
};

/**
 * @param {import('./utils.js').Logger} logger
 * @return {Promise<Db>}
 */
const getDb = async (logger) => {
  if (!dbPromise) {
    dbPromise = getClient(logger).then((client) => client.db(process.env.MONGODB_DB));
  }
  return dbPromise;
};

export {
  getClient,
  getDb,
};
