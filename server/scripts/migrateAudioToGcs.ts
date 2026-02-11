import dotenv from 'dotenv';

dotenv.config({path: '.env.dev', debug: true});

import {pino} from 'pino';
import {getDb} from '../src/repo/repo.js';
import * as GoogleCloudStorage from '../src/services/googleCloudStorage.js';
import {Binary} from 'mongodb';

process.env.MONGODB_DB = 'ptbot';
const WORD_COLLECTION_NAME = 'english_words';

const main = async () => {
  const logger = pino({level: 'info'});
  const db = await getDb(logger);
  const words = db.collection(WORD_COLLECTION_NAME);

  const filter = {
    Audio: {$exists: true, $ne: null},
    AudioURL: {$exists: false},
  };

  const count = await words.countDocuments(filter);
  logger.info(`Found ${count} documents with binary Audio and no AudioURL.`);

  if (count === 0) {
    logger.info('No migration needed.');
    await db.client.close();
    return;
  }

  const cursor = words.find(filter);

  let successCount = 0;
  let errorCount = 0;

  for await (const word of cursor) {
    try {
      const audioBinary = word.Audio as Binary;
      const audioData = audioBinary.buffer;
      const wordId = word._id.toString();

      logger.info({wordId}, `Uploading audio for word ${wordId}`);

      const audioURL = await GoogleCloudStorage.getInstance().uploadAudio(
          new Uint8Array(audioData),
          `${wordId}.ogg`,
          logger,
      );

      await words.updateOne(
          {_id: word._id},
          {
            $set: {AudioURL: audioURL},
            $unset: {Audio: ''},
          },
      );

      successCount++;
    } catch (err) {
      logger.error({err, wordId: word._id}, 'Failed to migrate audio for word');
      errorCount++;
    }
  }

  logger.info(`Migration finished. Success: ${successCount}, Errors: ${errorCount}`);

  await db.client.close();
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
