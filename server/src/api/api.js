const {Bot} = require('../telegram');

const {verifyTelegramWebAppData} = require('./verify');
const fastify = require('fastify');
const dotenv = require('dotenv');
const fastifyCors = require('@fastify/cors');

/**
 * Api
 */
class Api {
  #bot;
  #server;

  /**
   * Api constructor
   */
  constructor() {
    this.#bot = new Bot();
    this.#server = fastify({logger: true});

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


    this.#server.addHook('preHandler', async (request, reply) => {
      try {
        const telegramInitData = request.headers['telegram-init-data'];
        if (!telegramInitData) {
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

    this.#server.get('/ping', (_req, res) => {
      res.send({msg: 'pong'});
    });

    this.#server.post('/chat/:chat_id/word/:word_id', async (req, res) => {
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
            chatID: Number.parseInt(req.params['chat_id']),
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

  /**
   * handler for google cloud functions
   *
   * @param {any} req
   * @param {any} res
   */
  handleRequest = async (req, res) => {
    await this.#server.ready();
    this.#server.server.emit('request', req, res);
  };
}

module.exports = {
  Api,
};


if (require.main === module && process.argv[2] === '--dev') {
  dotenv.config({path: '.env.dev', debug: true});

  const server = new Api();

  server.start();
}
