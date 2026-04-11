import {pino} from 'pino';

import {runReviseWordNotifications} from '../services/reviseWordNotifications.js';

const main = async (): Promise<void> => {
  const logger = pino({level: process.env.PINO_LOG_LEVEL || 'info'});
  await runReviseWordNotifications(logger);
};

main().then(() =>
  process.exit(0),
).catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
