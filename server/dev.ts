import dotenv from 'dotenv';
dotenv.config({path: '.env.dev', debug: true});

import {fileURLToPath} from 'node:url';
import {Bot} from './src/telegram.js';
import {Api} from './src/api/api.js';


const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain && process.argv[2] === '--bot') {
  const bot = new Bot();
  bot.startPolling();
}

if (isMain && process.argv[2] === '--api') {
  const server = new Api();
  server.start();
}
