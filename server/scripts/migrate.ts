import {pino} from 'pino';
import {getDb} from '../src/repo/repo.js';
import {minusDaysFromNow} from '../src/repo/utils.js';


const WORD_COLLECTION_NAME = 'english_words';

const main = async () => {
  const logger = pino({level: 'debug'});
  const db = await getDb(logger);

  const words = db.collection(WORD_COLLECTION_NAME);

  const filter = {'Last Revised': {$exists: false}};
  const count = await words.countDocuments(filter);
  logger.info(`Found ${count} documents where "Last Revised" is not defined.`);
  if (count) {
    const updates = await words.updateMany(filter, {
      $set: {
        'Last Revised': minusDaysFromNow(39),
      },
    });

    logger.info('Updated : ' + updates.modifiedCount);
  } else {
    logger.info('no documents found');
  }

  await db.client.close();
};

main();
