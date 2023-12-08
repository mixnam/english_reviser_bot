// eslint-disable-next-line
const TelegramBot = require("node-telegram-bot-api");
const {AddNewWordFlow} = require('../index');
const {
  getUserByChatID,
  setUserStepID,
  setUserState,
} = require('../../repo/users');
const {renderNoIdea} = require('../../render/renderTextMsg');

// eslint-disable-next-line
/**
 * @param {TelegramBot} bot
 * @param {import("../../repo/users").User} user
 */
const forceAction = async (bot, user) => {
  const {stepID} = user;
  if (stepID === null) {
    console.error('User has no active step');
    return;
  }

  // TODO: introduce FlowMap
  const step = AddNewWordFlow[stepID];
  const result = await step.makeAction(user);
  if (result instanceof Error) {
    console.error(result);
    return;
  }
  const [
    actionText,
    actionKeyboard,
    audio,
    onFileUploaded,
    telegramPictureId,
  ] = result;

  const sendPhotoPromise = telegramPictureId ?
        bot.sendPhoto(user.chatID, telegramPictureId) :
        Promise.resolve();

  const sendMsgPromise = audio ?
    bot.sendVoice(user.chatID, Buffer.from(audio), {
      caption: actionText,
      parse_mode: 'MarkdownV2',
      reply_markup: actionKeyboard !== null ?
        actionKeyboard :
       {
         remove_keyboard: true,
       },
    }) :
    bot.sendMessage(user.chatID, actionText, {
      parse_mode: 'MarkdownV2',
      reply_markup: actionKeyboard !== null ?
        actionKeyboard :
        {
          remove_keyboard: true,
        },
    });

  const msg = await sendPhotoPromise.then(() => sendMsgPromise);

  if (onFileUploaded && msg.voice) {
    onFileUploaded(msg.voice.file_id);
  }
};

/**
 * @param {TelegramBot} bot
 * @param {number} chatID
 * @param {TelegramBot.Message} msg
 */
const forceTransition = async (bot, chatID, msg) => {
  const user = await getUserByChatID(chatID);
  if (user instanceof Error) {
    console.log(user);
    return;
  }
  if (user === null) {
    console.error(`no user with chatID - ${chatID}`);
    return;
  }

  const {stepID} = user;
  if (stepID === null) {
    console.error('User has no active step');
    bot.sendMessage(
        chatID,
        renderNoIdea(),
    );
    return;
  }

  // TODO: introduce FlowMap
  const step = AddNewWordFlow[stepID];
  const [newState, newStepID] = await step.makeTransition(msg, user, bot);

  let result = await setUserStepID(user._id, newStepID);
  if (result !== null) {
    console.error(`can't update user step- ${result}`);
    return;
  }
  result = await setUserState(user._id, newState);
  if (result !== null) {
    console.error(`can't update user state - ${result}`);
    return;
  }
  user.state = newState;
  user.stepID = newStepID;
  forceAction(bot, user);
};

module.exports = {
  forceAction,
  forceTransition,
};
