import functions from "@google-cloud/functions-framework";
import {Api, Bot} from "server";

// Reuse the same bot instance across invocations to keep the Mongo client warm.
const bot = new Bot();
functions.http('telegram', async (req, res) => {
  if (req.method !== 'POST' || req.url !== '/') {
    res.sendStatus(404);
    return;
  }

  try {
    await bot.handleRequest(req.body);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

const api = new Api();
// @ts-expect-error fix fastify types 
api.addContentTypeParser('application/json', {}, (req, body, done) => {
  // @ts-expect-error fix fastify types 
  done(null, body.body);
});

functions.http('api', async (req, res) => {
  await api.handleRequest(req, res);
});
