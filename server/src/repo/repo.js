const {MongoClient, ServerApiVersion} = require('mongodb');

global.client = null;

/**
 * @return {Promise<MongoClient>}
 */
const getClient = async () => {
  if (global.client) {
    console.log('Using existing client');
    return global.client;
  }

  const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@englishbot.nkcnrjn.mongodb.net/?retryWrites=true&w=majority`;
  global.client = new MongoClient(uri, {
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

module.exports = {
  getClient,
};
