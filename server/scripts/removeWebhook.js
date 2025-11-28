import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

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
