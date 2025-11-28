#!/usr/bin/env node
/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';

import dotenv from 'dotenv';

import {TTSService} from '../src/tts/openaiTts.js';

dotenv.config({path: '.env.dev', debug: true});

const OUTPUT_FILE = process.argv[2] ?? 'tts-sample.ogg';
const SAMPLE_TEXT = process.argv[3] ?? 'This is a test audio file generated via OpenAI text to speech.';

const generate = async () => {
  console.log(`Generating TTS audio for: "${SAMPLE_TEXT}"`);
  const audio = await TTSService.getAudioForText(SAMPLE_TEXT);
  if (audio instanceof Error) {
    console.error('Failed to generate audio:', audio.message);
    process.exit(1);
  }

  const outputPath = path.resolve(process.cwd(), OUTPUT_FILE);
  await fs.promises.writeFile(outputPath, Buffer.from(audio));
  console.log(`Audio saved to ${outputPath}`);
};

generate().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
