import dotenv from 'dotenv';
import {fileURLToPath} from 'node:url';
import {pino} from 'pino';

// Load environment variables from .env.dev for testing
dotenv.config({path: '.env.dev', debug: true});

import {getInstance as getGoogleImageServiceInstance} from '../src/services/googleImage.js';

const logger = pino({level: process.env.PINO_LOG_LEVEL || 'info'});

const searchTestImages = async () => {
  const word = 'cat';
  const query = `${word} illustration`;

  logger.info(`Searching for images for: "${query}"`);

  const start = Date.now();
  const GoogleImageService = getGoogleImageServiceInstance();
  const result = await GoogleImageService.searchImages(query, logger);
  const duration = Date.now() - start;

  if (result instanceof Error) {
    logger.error({duration, err: result}, `Error searching for images`);
  } else if (result.length > 0) {
    logger.info({duration, urls: result}, `Successfully found images`);
  } else {
    logger.warn({duration}, 'No images found or GOOGLE_SEARCH_API_KEY/GOOGLE_SEARCH_ENGINE_ID not set.');
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  searchTestImages();
}
