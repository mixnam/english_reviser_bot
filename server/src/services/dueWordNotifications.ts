import TelegramBot from 'node-telegram-bot-api';
import {pino, Logger} from 'pino';

import {getDueLearnWordCountByUserID} from '../repo/words.js';
import {
  getUsersEligibleForDueWordNotification,
  setUserDueWordsNotificationSent,
  User,
} from '../repo/users.js';
import {
  renderDueWordsNotification,
  renderDueWordsNotificationCta,
} from '../render/renderTextMsg.js';

const buildLearnUrl = (chatID: number | string): string | null => {
  const tmaUrl = process.env.TMA_URL;
  if (!tmaUrl) return null;
  return `${tmaUrl}/learn?chat_id=${chatID}`;
};

const sendDueWordsNotification = async (
    bot: TelegramBot,
    user: User,
    wordCount: number,
    logger: Logger,
): Promise<boolean> => {
  const learnUrl = buildLearnUrl(user.chatID);
  const options: TelegramBot.SendMessageOptions = {
    reply_markup: learnUrl ? {
      inline_keyboard: [[{text: renderDueWordsNotificationCta(), web_app: {url: learnUrl}}]],
    } : undefined,
  };

  const text = renderDueWordsNotification(wordCount);
  await bot.sendMessage(user.chatID, text, options);
  logger.info({userID: user._id, chatID: user.chatID, wordCount}, 'Sent due-word notification');
  return true;
};

const runDueWordNotifications = async (logger: Logger): Promise<void> => {
  const botToken = process.env.TELEGRAM_BOT_API_KEY;
  if (!botToken) throw new Error('TELEGRAM_BOT_API_KEY is not specified');

  const bot = new TelegramBot(botToken, {polling: false});
  const now = new Date();
  const eligibleUsers = await getUsersEligibleForDueWordNotification(now, logger);
  if (eligibleUsers instanceof Error) {
    throw eligibleUsers;
  }

  let sent = 0;
  let skippedZero = 0;
  for (const user of eligibleUsers) {
    const count = await getDueLearnWordCountByUserID(user._id, logger.child({userID: user._id}));
    if (count instanceof Error) {
      logger.error({err: count, userID: user._id}, 'Failed to count due words');
      continue;
    }
    if (count <= 0) {
      skippedZero += 1;
      continue;
    }
    try {
      await sendDueWordsNotification(bot, user, count, logger.child({userID: user._id}));
      const updateResult = await setUserDueWordsNotificationSent(user._id, now, logger.child({userID: user._id}));
      if (updateResult instanceof Error) {
        logger.error({err: updateResult, userID: user._id}, 'Failed to persist notification timestamp');
      } else {
        sent += 1;
      }
    } catch (err) {
      logger.error({err, userID: user._id}, 'Failed to send due-word notification');
    }
  }

  logger.info({eligibleUsers: eligibleUsers.length, sent, skippedZero}, 'Due-word notifications completed');
};

const main = async (): Promise<void> => {
  const logger = pino({level: process.env.PINO_LOG_LEVEL || 'info'});
  await runDueWordNotifications(logger);
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}

export {runDueWordNotifications};
