// eslint-disable-next-line
const TelegramBot = require("node-telegram-bot-api");
const {AddNewWordFlow} = require('../index');
const {
  getUserByChatID,
  setUserStepID,
  setUserState,
} = require('../../repo/users');

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
  const [
    actionText,
    actionKeyboard,
    audio,
    onFileUploaded,
  ] = await step.makeAction(user);

  let msg;
  if (audio) {
    msg = await bot.sendVoice(user.chatID, audio, {
      caption: actionText,
      parse_mode: 'MarkdownV2',
      reply_markup: actionKeyboard !== null ? {
        keyboard: actionKeyboard,
      } : {
        remove_keyboard: true,
      },
    });
  } else {
    msg = await bot.sendMessage(user.chatID, actionText, {
      parse_mode: 'MarkdownV2',
      reply_markup: actionKeyboard !== null ? {
        keyboard: actionKeyboard,
      } : {
        remove_keyboard: true,
      },
    });
  }
  onFileUploaded?.(msg.voice.file_id);
};

// eslint-disable-next-line
/**
 * @param {TelegramBot} bot
 * @param {string} chatID
 * @param {string} userAnswer
 */
const forceTransition = async (bot, chatID, userAnswer) => {
  const user = await getUserByChatID(chatID);
  if (user instanceof Error) {
    console.log(user);
    return;
  }
  if (user === null) {
    console.error(`no user with chatID - ${msg.chat.id}`);
    return;
  }

  const {stepID} = user;
  if (stepID === null) {
    console.error('User has no active step');
    bot.sendMessage(
        chatID,
        'Have no idea what you want from me',
    );
    return;
  }

  // TODO: introduce FlowMap
  const step = AddNewWordFlow[stepID];
  const [newState, newStepID] = await step.makeTransition(userAnswer, user);

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
