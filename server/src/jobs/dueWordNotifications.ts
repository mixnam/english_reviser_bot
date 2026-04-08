import {pino} from 'pino';

import {runDueWordNotifications} from '../services/dueWordNotifications.js';

const main = async (): Promise<void> => {
  const logger = pino({level: process.env.PINO_LOG_LEVEL || 'info'});
  await runDueWordNotifications(logger);
};

main().then(() =>
  process.exit(0),
).catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
