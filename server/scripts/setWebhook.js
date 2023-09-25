const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');

const WebhookURL = process.argv[2];
if (!WebhookURL) {
  console.error('Specify WebhookURL as a first command line argument');
  process.exit(-1);
}

dotenv.config();

const bot = new TelegramBot(
    process.env.TELEGRAM_BOT_API_KEY,
);
bot.setWebHook(WebhookURL)
    .then(() => {
      console.log(`Web hook is on on this URL - ${WebhookURL}`);
      process.exit(0);
    }).catch((err) => {
      console.error(err);
      process.exit(-1);
    });

