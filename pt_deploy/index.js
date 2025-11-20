const functions = require('@google-cloud/functions-framework');
const {Api, Bot} = require('server');

functions.http('telegram', (req, res) => {
    if (req.method === 'POST' && req.url === '/') {
        const bot = new Bot();
        bot.handleRequest(req.body).then(() => {
            res.sendStatus(200);
        });
    } else {
        res.sendStatus(404);
    }
});

const api = new Api()
api.addContentTypeParser('application/json', {}, (req, body, done) => {
    done(null, body.body);
});

functions.http('api', async (req, res) => {
    await api.handleRequest(req, res);
})

