// eslint-disable-next-line
import TelegramBot from 'node-telegram-bot-api';

import {AddNewWordFlow} from '../index.js';
import {
  getUserByChatID,
  setUserStepID,
  setUserState,
} from '../../repo/users.js';
import {renderNoIdea} from '../../render/renderTextMsg.js';

/**
 * @typedef {import('pino').Logger} Logger
 */

/**
 * @param {TelegramBot} bot
 * @param {import("../../repo/users.js").User} user
 * @param {Logger} logger
 *
 * @returns {Promise<null>}
 */
const forceAction = async (bot, user, logger) => {
  const {stepID} = user;
  const ctx = {stepID, state: user.state};
  if (stepID === null) {
    logger.error(ctx, 'User has no active step');
    return;
  }

  // TODO: introduce FlowMap
  const step = AddNewWordFlow[stepID];
  const result = await step.makeAction(user, logger.child(ctx));
  if (result instanceof Error) {
    logger.error({...ctx, err: result}, 'step.makeAction error');
    return;
  }
  const [
    actionText,
    actionKeyboardFn,
    audio,
    onFileUploaded,
    telegramPictureId,
  ] = result;

  const actionKeyboard = actionKeyboardFn ? actionKeyboardFn(user.chatID) : null;

  const sendPhotoPromise = telegramPictureId ?
        bot.sendPhoto(user.chatID, telegramPictureId) :
        Promise.resolve();

  const sendMsgPromise = audio ?
    bot.sendVoice(user.chatID, Buffer.from(audio), {
      caption: actionText,
      parse_mode: 'MarkdownV2',
      reply_markup: actionKeyboard ?
        actionKeyboard :
       {
         remove_keyboard: true,
       },
    }, {
      filename: 'example.ogg',
      contentType: 'audio/ogg',
    }) :
    bot.sendMessage(user.chatID, actionText, {
      parse_mode: 'MarkdownV2',
      reply_markup: actionKeyboard ?
        actionKeyboard :
        {
          remove_keyboard: true,
        },
    });

  try {
    await sendPhotoPromise;
    const msg = await sendMsgPromise;

    if (onFileUploaded && msg.voice) {
      await onFileUploaded(msg.voice.file_id);
    }
  } catch (err) {
    logger.error(ctx, err);
    return;
  }
};

/**
 * @param {TelegramBot} bot
 * @param {number} chatID
 * @param {TelegramBot.Message} msg
 * @param {Logger} logger
 *
 * @returns {Promise<null>}
 */
const forceTransition = async (bot, chatID, msg, logger) => {
  const user = await getUserByChatID(chatID, logger);
  if (user instanceof Error) {
    logger.error(user);
    return;
  }
  if (user === null) {
    logger.error(`no user with chatID - ${chatID}`);
    return;
  }

  const {stepID} = user;

  const ctx = {
    stepID,
    state: user.state,
    userID: user._id,
    userAnswer: msg.text,
  };

  if (stepID === null) {
    logger.error(ctx, 'User has no active step');
    bot.sendMessage(
        chatID,
        renderNoIdea(),
    );
    return;
  }

  // TODO: introduce FlowMap
  const step = AddNewWordFlow[stepID];
  const [newState, newStepID] = await step.makeTransition(msg, user, bot, logger.child(ctx));
  logger.info({...ctx, newState}, `Success transition from ${user.stepID} to ${newStepID}`);

  let result = await setUserStepID(user._id, newStepID, logger.child(ctx));
  if (result !== null) {
    logger.error(ctx, `can't update user step - ${result}`);
    return;
  }
  result = await setUserState(user._id, newState, logger.child(ctx));
  if (result !== null) {
    logger.error(ctx, `can't update user state - ${result}`);
    return;
  }
  user.state = newState;
  user.stepID = newStepID;

  return forceAction(bot, user, logger);
};

/**
 * @param {TelegramBot.ReplyKeyboardMarkup | TelegramBot.InlineKeyboardMarkup | null} input
 * @returns {input is TelegramBot.InlineKeyboardMarkup}
 */
const isInlineKeyboard = (input) => {
  if ('inline_keyboard' in input) {
    return true;
  }
  return false;
};

/**
 * @param {TelegramBot.ReplyKeyboardMarkup | TelegramBot.InlineKeyboardMarkup | null} input
 * @returns {input is TelegramBot.InlineKeyboardMarkup}
 */
const isReplyKeyboard = (input) => {
  if ('keyboard' in input) {
    return true;
  }
  return false;
};

export {
  forceAction,
  forceTransition,
};
