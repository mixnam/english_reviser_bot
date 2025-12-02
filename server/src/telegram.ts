import TelegramBot from 'node-telegram-bot-api';
import pino from 'pino';
import {Logger} from 'pino';

import {ReviseCommand, ReviseCallbackId} from './commands/revise.js';
import {LearnCommand, LearnCallbackId} from './commands/learn.js';
import {TestCommand} from './commands/test.js';
import {StartCommand} from './commands/start.js';
import {forceTransition} from './flows/processor/index.js';
import {AddCommand} from './commands/add.js';
import {EditWordCommand, EditWordMsg} from './webAppCommands/editWord.js';
import {AddWordCommand, AddWordMsg} from './webAppCommands/addWord.js';
import {renderHelpMsg} from './render/renderHelpMsg.js';
import {renderYouAreNotMyMaster} from './render/renderTextMsg.js';

// The createLogger from pino returns a Logger type, so we can directly type it.
const createLogger = pino;

type WebAppMsg = EditWordMsg | AddWordMsg;

/**
 * Bot
 */
class Bot {
  private bot: TelegramBot;
  private reviseCommand: ReviseCommand;
  private learnCommand: LearnCommand;
  private testCommand: TestCommand;
  private startCommand: StartCommand;
  private addCommand: AddCommand;
  private editLearnWordWebAppCommand: EditWordCommand;
  private addWordWebAppCommand: AddWordCommand;

  private editReviseWordWebAppCommand: EditWordCommand;
  private updateResolverMap: {[key: string | number]: (() => void) | undefined};
  private logger: Logger;

  constructor() {
    if (!process.env.TELEGRAM_BOT_API_KEY) {
      throw new Error('TELEGRAM_BOT_API_KEY is not specified');
    }
    this.bot = new TelegramBot(
        process.env.TELEGRAM_BOT_API_KEY,
    );
    this.logger = createLogger({level: process.env.PINO_LOG_LEVEL || 'info'});

    this.reviseCommand = new ReviseCommand(this.bot, this.logger);
    this.learnCommand = new LearnCommand(this.bot, this.logger);
    this.startCommand = new StartCommand(this.bot, this.logger);
    this.addCommand = new AddCommand(this.bot, this.logger);

    this.testCommand = new TestCommand(this.bot, this.logger);
    this.addWordWebAppCommand = new AddWordCommand(
        this.bot,
        this.logger.child({command: 'AddWordCommand'}),
    );
    this.editLearnWordWebAppCommand = new EditWordCommand(
        this.bot,
        this.logger.child({command: 'EditWordCommand'}),
        this.learnCommand.sendLearnWordMessage,
    );

    // Not used for now
    this.editReviseWordWebAppCommand = new EditWordCommand(
        this.bot,
        this.logger.child({command: 'EditWordCommand'}),
        this.reviseCommand.sendWord,
    );

    this.updateResolverMap = {};

    this.setup();
  }

  private setup = () => {
    this.bot.on('message', async (msg: TelegramBot.Message) => {
      switch (msg.text) {
        case '/start':
          await this.startCommand.processMsg(msg);
          break;
        case '/help':
          await this.bot.sendMessage(
              msg.chat.id,
              renderHelpMsg(), {
                parse_mode: 'MarkdownV2',
              });
          break;
        case '/revise':
          await this.reviseCommand.processMsg(msg);
          break;
        case '/learn':
          await this.learnCommand.processMsg(msg);
          break;
        case '/add':
          await this.addCommand.processMsg(msg);
          break;
        case '/ping':
          await this.protectedCommand(msg, async () => {
            return this.bot.sendMessage(
                msg.chat.id,
                `Pong: ${new Date()}`,
            );
          });
          break;
        case '/test':
          await this.protectedCommand(msg, this.testCommand.processMsg.bind(this.testCommand));
          break;
        default:
          await forceTransition(this.bot, msg.chat.id, msg, this.logger.child({chatID: msg.chat.id}));
      }

      const msgResolver = this.updateResolverMap[msg.message_id];
      delete this.updateResolverMap[msg.message_id];
      msgResolver?.();
    });

    this.bot.on('callback_query', async (query: TelegramBot.CallbackQuery) => {
      if (!query.data) {
        this.logger.error('No data in callback_query');
        return;
      }
      if (!query.message) {
        this.logger.error('No message in callback_query');
        return;
      }
      const callbackData = this.parseCallbackData(query.data);
      if (callbackData instanceof Error) {
        this.logger.error(callbackData);
        return;
      }
      const [callbakId, data] = callbackData;
      switch (callbakId) {
        case ReviseCallbackId:
          await this.reviseCommand.processCallback(query.message, data);
          break;
        case LearnCallbackId:
          await this.learnCommand.processCallback(query.message, data);
          break;
        default:
          // deadcode
          // enchancment add forceCallbackTransition
          forceTransition(this.bot, query.message.chat.id, query.message, this.logger);
      }

      const msgResolver = this.updateResolverMap[query.id];
      delete this.updateResolverMap[query.id];
      msgResolver?.();
    });
  };

  private accessChecker = (msg: TelegramBot.Message): boolean => {
    if (msg.chat.username === process.env.TELEGRAM_MASTER_USER) {
      return true;
    }
    return false;
  };

  private protectedCommand = async <T extends (msg: TelegramBot.Message) => Promise<unknown>>(
    msg: TelegramBot.Message,
    fn: T,
  ): Promise<unknown> => {
    if (!this.accessChecker(msg)) {
      return this.bot.sendMessage(
          msg.chat.id,
          renderYouAreNotMyMaster(),
      );
    }
    return fn(msg);
  };

  private parseCallbackData = (input: string): [string, unknown[]] | Error => {
    const parsed = input.split(',');
    if (typeof parsed[0] === 'string') {
      return [parsed[0], parsed.slice(1)];
    }
    return new Error(`can't parse callback_data: ${input}`);
  };

  handleWebAppMessage = async (msg: WebAppMsg): Promise<null | Error | void> => {
    switch (msg.type) {
      case 'edit_word_msg':
        return this.editLearnWordWebAppCommand.processMsg(msg);
      case 'add_word_msg':
        return this.addWordWebAppCommand.processMsg(msg);
      default:
        // This default case should ideally not be reached if WebAppMsg is properly discriminated
        // and covers all possible msg.type values.
        // However, if new types are added to WebAppMsg, this default might return null.
        // Returning null here as per original JSDoc.
        return null;
    }
  };

  handleRequest = (update: TelegramBot.Update): Promise<null> => {
    const id = update.message?.message_id ?? update.callback_query?.id;
    let resolve: (() => void) | undefined;
    const status = new Promise<null>((res) => {
      resolve = () => res(null); // Resolve with null
    });
    this.updateResolverMap[id] = resolve;

    this.bot.processUpdate(update);

    return status;
  };

  startPolling = (): void => {
    this.bot.startPolling();
  };
}

export {Bot};

