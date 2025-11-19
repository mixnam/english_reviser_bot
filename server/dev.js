const dotenv = require('dotenv');
dotenv.config({path: '.env.dev', debug: true});

const {Bot} = require('./src/telegram');

const bot = new Bot();
bot.startPolling();
