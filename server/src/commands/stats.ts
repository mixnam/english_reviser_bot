import TelegramBot from 'node-telegram-bot-api';
import {Logger} from 'pino';
import {Command} from './command.js';
import {getWordsStats} from '../repo/words.js';
import {
  renderNoWordsFound,
} from '../render/renderTextMsg.js';
import {renderWordsStats} from '../render/renderWord.js';

class StatsCommand extends Command {
  private bot: TelegramBot;

  constructor(bot: TelegramBot, logger: Logger) {
    super(logger.child({command: 'StatsCommand'}));
    this.bot = bot;
  }

  processMsg = async (msg: TelegramBot.Message): Promise<null> => {
    const user = await this.getSessionUser(msg);
    if (user instanceof Error) {
      this.logger.error(user, 'getSessionUser error');
      return null;
    }

    const stats = await getWordsStats(user._id, this.logger);
    if (stats instanceof Error) {
      this.logger.error(stats, 'getWordsStats error');
      return null;
    }

    let totalWords = 0;
    Object.values(stats).forEach((count) => {
      totalWords += count;
    });

    if (totalWords === 0) {
      this.bot.sendMessage(msg.chat.id, renderNoWordsFound());
      return null;
    }

    const message = renderWordsStats(stats);

    this.bot.sendMessage(msg.chat.id, message, {
      parse_mode: 'MarkdownV2',
    });
    return null;
  };
}

export {StatsCommand};
