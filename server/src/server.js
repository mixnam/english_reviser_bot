import fastify from 'fastify';
import dotenv from 'dotenv';

dotenv.config();

const server = fastify({
  logger: true,
});

server.get('/', async function handler(_request, _reply) {
  return {hello: 'world'};
});

try {
  server.listen({port: process.env.PORT});
} catch (err) {
  server.log.error(err);
  process.exit(1);
}
