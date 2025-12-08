import dotenv from 'dotenv';
import {fileURLToPath} from 'node:url';
import {pino} from 'pino';

// Load environment variables from .env.dev for testing
dotenv.config({path: '.env.dev', debug: true});

import {getInstance} from '../src/services/openAIImage.js';

const logger = pino({level: process.env.PINO_LOG_LEVEL || 'info'});

const generateTestImage = async () => {
  const word = 'speak';
  const translation = 'говорить';
  const model = process.env.OPENAI_IMAGE_MODEL || 'dall-e-3';

  const OpenAIImageService = getInstance();

  logger.info({model}, `Attempting to generate image for: "${word}" (translation: "${translation}")`);

  const start = Date.now();
  const result = await OpenAIImageService.generateImage(word, translation, logger);
  const duration = Date.now() - start;

  if (result instanceof Error) {
    logger.error({duration, err: result}, `Error generating image`);
  } else if (result instanceof Buffer) {
    const fs = await import('fs');
    fs.writeFileSync('test.jpg', result);
  } else if (result) {
    logger.info({duration, url: result}, `Successfully generated image`);
  } else {
    logger.warn({duration}, 'No image URL returned (perhaps API key is not set?).');
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateTestImage();
}

