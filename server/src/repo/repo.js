// eslint-disable-next-line
const {MongoClient, ServerApiVersion, Db} = require('mongodb');

global.client = null;

/**
 * @param {import('./utils').Logger} logger
 * @return {Promise<MongoClient>}
 */
const getClient = async (logger) => {
  if (!process.env.MONGODB_URI) {
    throw new Error('There is not env MONGODB_URI');
  }
  if (global.client) {
    logger.info('Using existing client');
    return global.client;
  }

  global.client = new MongoClient(process.env.MONGODB_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await global.client.connect();
  logger.info('New connection is opened');
  return global.client;
};

/**
 * @param {import('./utils').Logger} logger
 * @return {Promise<Db>}
 */
const getDb = async (logger) => {
  const client = await getClient(logger);
  return client.db(process.env.MONGODB_DB);
};

module.exports = {
  getClient,
  getDb,
};
