import dotenv from 'dotenv';

dotenv.config({path: '.env.dev', debug: true});

import {pino} from 'pino';
import {getDb} from '../src/repo/repo.js';
import * as GoogleCloudStorage from '../src/services/googleCloudStorage.js';
import TelegramBot from 'node-telegram-bot-api';

process.env.MONGODB_DB = 'ptbot';
const WORD_COLLECTION_NAME = 'english_words';

const streamToBuffer = async (stream: NodeJS.ReadableStream): Promise<Buffer> => {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Uint8Array);
  }
  return Buffer.concat(chunks);
};

const getExtension = (buffer: Buffer): string => {
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'png';
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return 'gif';
  return 'jpg'; // default
};

const main = async () => {
  const logger = pino({level: 'info'});

  if (!process.env.TELEGRAM_BOT_API_KEY) {
    throw new Error('TELEGRAM_BOT_API_KEY is not specified');
  }

  const bot = new TelegramBot(process.env.TELEGRAM_BOT_API_KEY);
  const db = await getDb(logger);
  const words = db.collection(WORD_COLLECTION_NAME);

  const filter = {
    TelegramPictureID: {$exists: true, $ne: null},
    ImageURL: {$exists: false},
  };

  const count = await words.countDocuments(filter);
  logger.info(`Found ${count} documents with TelegramPictureID and no ImageURL.`);

  if (count === 0) {
    logger.info('No migration needed.');
    await db.client.close();
    return;
  }

  const cursor = words.find(filter);

  let successCount = 0;
  let errorCount = 0;

  for await (const word of cursor) {
    const wordId = word._id.toString();
    const telegramPictureID = word.TelegramPictureID;

    try {
      logger.info({wordId, telegramPictureID}, `Migrating image for word ${wordId}`);

      const imageStream = bot.getFileStream(telegramPictureID);
      const buffer = await streamToBuffer(imageStream);

      const ext = getExtension(buffer);
      logger.info({wordId, ext}, 'Determined file extension');

      const imageURL = await GoogleCloudStorage.getInstance().uploadImage(
          buffer,
          `${wordId}.${ext}`,
          logger,
      );

      await words.updateOne(
          {_id: word._id},
          {
            $set: {ImageURL: imageURL},
          },
      );

      successCount++;
    } catch (err) {
      logger.error({err, wordId: word._id}, 'Failed to migrate image for word');
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
