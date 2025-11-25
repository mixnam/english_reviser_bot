const dotenv = require('dotenv');
dotenv.config({path: '.env.dev', debug: true});

const {Bot} = require('./src/telegram.js');
const {Api} = require('./src/api/api.js');

if (require.main === module && process.argv[2] === '--bot') {
  const bot = new Bot();
  bot.startPolling();
}

if (require.main === module && process.argv[2] === '--api') {
  const server = new Api();
  server.start();
}
