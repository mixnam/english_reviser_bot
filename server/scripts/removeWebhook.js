const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');

dotenv.config();

const bot = new TelegramBot(
    process.env.TELEGRAM_BOT_API_KEY,
);
bot.deleteWebHook()
    .then(() => {
      console.log(`Web hook is off`);
      process.exit(0);
    }).catch((err) => {
      console.error(err);
      process.exit(-1);
    });

