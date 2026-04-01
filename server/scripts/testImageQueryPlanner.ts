import dotenv from 'dotenv';
import {fileURLToPath} from 'node:url';
import {pino} from 'pino';

// Load environment variables from .env for testing
dotenv.config({path: '.env.dev', debug: true});

import {getInstance} from '../src/services/openAIImageQueryPlanner.js';

const logger = pino({level: process.env.PINO_LOG_LEVEL || 'info'});

const testImageQueryPlanner = async () => {
  const word = process.argv[2] || 'cat';
  const translation = process.argv[3] || 'gato';

  logger.info(`Planning image search for: "${word}" (${translation})`);

  const start = Date.now();
  const planner = getInstance();
  const result = await planner.plan(word, translation, logger);
  const duration = Date.now() - start;

  if (result) {
    logger.info({duration, result}, `Successfully planned image search`);
  } else {
    logger.warn({duration}, 'Failed to plan image search. Check if OPENAI_API_KEY is set and valid.');
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  testImageQueryPlanner();
}
