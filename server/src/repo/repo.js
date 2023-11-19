// eslint-disable-next-line
const {MongoClient, ServerApiVersion, Db} = require('mongodb');

global.client = null;

/**
 * @return {Promise<MongoClient>}
 */
const getClient = async () => {
  if (global.client) {
    console.log('Using existing client');
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
  console.log('New connection is opened');
  return global.client;
};

/**
 * @return {Promise<Db>}
 */
const getDb = async () => {
  const client = await getClient();
  return client.db(process.env.MONGODB_DB);
};

module.exports = {
  getClient,
  getDb,
};
