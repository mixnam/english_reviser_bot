const {verifyTelegramWebAppData} = require('./verify');
const fastify = require('fastify');
const dotenv = require('dotenv');
const fastifyCors = require('@fastify/cors');
const server = fastify({logger: true});


// Register the CORS plugin
server.register(fastifyCors, {
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed methods
  // allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
  credentials: true, // Allow cookies to be sent
  maxAge: 86400, // Specify how long the results of a preflight request can be cached
});


server.addHook('preHandler', async (request, reply) => {
  try {
    server.log.warn(request.headers);
    const telegramInitData = request.headers['telegram-init-data'];
    if (!telegramInitData) {
      throw new Error('no right header');
    }
    const verified = verifyTelegramWebAppData(telegramInitData);
    if (!verified) {
      throw new Error('request is not verified');
    }
  } catch (err) {
    server.log.error(err);
    reply.code(401).send({message: 'Authentication failed'});
  }
});

server.get('/ping', (_req, res) => {
  res.send({msg: 'pong'});
});

server.post('/word/:id', (req, res) => {
  // TODO update word in db
  res.status(200);
  res.send();
});

module.exports = {
  server,
};


if (process.argv[2] === '--dev') {
  dotenv.config({path: '.env.dev', debug: true});
  const start = async () => {
    try {
      await server.listen({port: 3000});
      console.log('Server is running at http://localhost:3000');
    } catch (err) {
      server.log.error(err);
      process.exit(1);
    }
  };

  start();
}
