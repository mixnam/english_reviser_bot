import {FastifyInstance, FastifyRequest, FastifyReply, AddContentTypeParser} from 'fastify';
import {IncomingMessage, ServerResponse} from 'http';
import fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import {pino, Logger} from 'pino';

import {Bot} from '../telegram.js';
import {verifyTelegramWebAppData} from './verify.js';
import {wordRoutes} from './routes/wordRoutes.js';
import {WordController} from './controllers/wordController.js';
import {WordService} from './services/wordService.js';

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

    this.#server.register(fastifyMultipart, {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
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

    const wordService = new WordService(this.#bot, this.#logger);
    const wordController = new WordController(wordService);

    this.#server.register(wordRoutes, {wordController});

    this.#server.get('/ping', (_req, res) => {
      res.send({msg: 'pong'});
    });
  };

  addContentTypeParser = (...params: Parameters<AddContentTypeParser>) => {
    this.#server.addContentTypeParser(...params);
  };

  start = async () => {
    try {
      const port = process.env.PORT ? Number.parseInt(process.env.PORT) : 3000;
      await this.#server.listen({port, host: '0.0.0.0'});
      console.log(`Server is running at http://localhost:${port}`);
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
