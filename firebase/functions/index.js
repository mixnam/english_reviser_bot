/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest}= require('firebase-functions/v2/https');
const {setGlobalOptions}= require('firebase-functions/v2');

// const logger = require("firebase-functions/logger");
const {Bot} = require('server/src/telegram');

setGlobalOptions({
    region: 'europe-west1'
})

exports.telegram2 = onRequest((req, res) => {
    if (req.method === 'POST' && req.url === '/') {
        const bot = new Bot();
        bot.handleRequest(req.body).then(() => {
            res.sendStatus(200);
        });
    } else {
        res.sendStatus(404);
    }
})

