import {fileURLToPath} from 'node:url';

import fastify, {FastifyInstance, FastifyRequest, FastifyReply, AddContentTypeParser} from 'fastify';
import {IncomingMessage, ServerResponse} from 'http';
import dotenv from 'dotenv';
import fastifyCors from '@fastify/cors';
import {pino, Logger} from 'pino';
import {ObjectId} from 'mongodb';

import {Bot} from '../telegram.js';
import {verifyTelegramWebAppData} from './verify.js';
import {getSpelcheckSuggestions, Progress} from '../repo/words.js';
import {getUserByChatID} from '../repo/users.js';
import {OpenAIExamplesService} from '../services/openAIExamples.js';

/**
 * Api
 */
class Api {
  #bot: Bot;
  #server: FastifyInstance;
  #logger: Logger;
  #isDev: string | undefined;

  /**
   * Api constructor
   */
  constructor() {
    this.#bot = new Bot();
    this.#logger = pino({level: process.env.PINO_LOG_LEVEL || 'info'});
    this.#server = fastify({logger: true});
    this.#isDev = process.env.DEV;

    this.#setup();
  }

  #setup = () => {
    // Register the CORS plugin
    this.#server.register(fastifyCors, {
      origin: '*', // Allow all origins
      methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed methods
      credentials: true, // Allow cookies to be sent
      maxAge: 86400, // Specify how long the results of a preflight request can be cached
    });

    if (!this.#isDev) {
      this.#server.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          const telegramInitData = request.headers['telegram-init-data'];
          if (!telegramInitData || typeof telegramInitData !== 'string') {
            throw new Error('no right header');
          }
          const verified = verifyTelegramWebAppData(telegramInitData);
          if (!verified) {
            throw new Error('request is not verified');
          }
        } catch (err) {
          this.#server.log.error(err);
          reply.code(401).send({message: 'Authentication failed'});
        }
      });
    }

    this.#server.get('/ping', (_req, res) => {
      res.send({msg: 'pong'});
    });

    this.#server.post<{
      Params: {
        chat_id: string;
        word_id: string;
      }
    }>('/chat/:chat_id/word/:word_id', async (req, res) => {
      const messageID = req.headers['telegram-message-id'];
      if (typeof messageID !== 'string') {
        this.#server.log.error('No telegram-message-id header');
        res.code(403).send({message: 'No telegram-message-id header'});
        return;
      }

      try {
        await this.#bot.handleWebAppMessage({
          type: 'edit_word_msg',
          payload: {
            word: typeof req.body === 'string' ? JSON.parse(req.body): req.body,
            chatID: Number.parseInt(req.params.chat_id),
            messageID: Number.parseInt(messageID),
          },
        });
      } catch (err) {
        this.#server.log.error(err);
        res.code(500).send();
        return;
      }

      res.code(200).send();
    });

    this.#server.post<{
      Params: {
        chat_id: string;
      },
      Body: {
        word: string;
      }
    }>('/chat/:chat_id/word/similar', async (req, res) => {
      const user = await getUserByChatID(Number.parseInt(req.params.chat_id), this.#logger);
      if (user instanceof Error) {
        this.#logger.error(user);
        res.code(500).send();
        return;
      }

      const suggestions = await getSpelcheckSuggestions(req.body.word, user._id, this.#logger);
      if (suggestions instanceof Error) {
        this.#logger.error(suggestions);
        res.code(500).send();
        return;
      }

      res.code(200).send(JSON.stringify({words: suggestions.map(({English}) => English)}));
    });

    this.#server.post<{
      Params: {
        chat_id: string;
      },
      Body: {
        word: string;
        translate: string;
      }
    }>('/chat/:chat_id/word/example', async (req, res) => {
      const user = await getUserByChatID(Number.parseInt(req.params.chat_id), this.#logger);
      if (user instanceof Error) {
        this.#logger.error(user);
        res.code(500).send();
        return;
      }

      const {word, translate} = req.body;

      const aiExample = await OpenAIExamplesService.generateExampleSentence(
          word,
          translate,
          process.env.LANGUAGE_CODE,
          this.#logger,
      );
      if (aiExample instanceof Error) {
        this.#logger.error(aiExample);
        res.code(500).send();
        return;
      }

      res.code(200).send(JSON.stringify({example: aiExample}));
    });

    this.#server.post<{
      Params: {
        chat_id: string;
      },
      Body: {
        word: string;
        translation: string;
        example: string | null;
      }
    }>('/chat/:chat_id/word/save', async (req, res) => {
      const user = await getUserByChatID(Number.parseInt(req.params.chat_id), this.#logger);
      if (user instanceof Error) {
        this.#logger.error(user);
        res.code(500).send();
        return;
      }

      const {word, translation, example} = req.body;

      const newWord = {
        _id: new ObjectId().toString(),
        userID: user._id,
        English: word,
        Translation: translation,
        Examples: example,
        Progress: Progress.HaveProblems,
      };

      try {
        await this.#bot.handleWebAppMessage({
          type: 'add_word_msg',
          payload: {
            chatID: Number.parseInt(req.params.chat_id),
            word: newWord,
          },
        });
      } catch (err) {
        this.#logger.error(err);
        res.code(500).send();
        return;
      }

      res.code(200).send();
    });
  };

  addContentTypeParser = (...params: Parameters<AddContentTypeParser>) => {
    this.#server.addContentTypeParser(...params);
  };

  start = async () => {
    try {
      await this.#server.listen({port: 3000});
      console.log('Server is running at http://localhost:3000');
    } catch (err) {
      this.#server.log.error(err);
      process.exit(1);
    }
  };

  handleRequest = async (
      req: IncomingMessage,
      res: ServerResponse,
  ) => {
    await this.#server.ready();
    this.#server.server.emit('request', req, res);
  };
}

export {Api};


if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv[2] === '--dev') {
  dotenv.config({path: '.env.dev', debug: true});

  const server = new Api();

  server.start();
}
