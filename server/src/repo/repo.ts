import {MongoClient, ServerApiVersion, Db} from 'mongodb';
import {Logger} from 'pino';

let clientPromise: Promise<MongoClient> | null = null;
let dbPromise: Promise<Db> | null = null;

const getClient = async (logger: Logger): Promise<MongoClient> => {
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

const getDb = async (logger: Logger): Promise<Db> => {
  if (!dbPromise) {
    dbPromise = getClient(logger).then((client) => client.db(process.env.MONGODB_DB));
  }
  return dbPromise;
};

export {
  getClient,
  getDb,
};
