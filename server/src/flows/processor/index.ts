import TelegramBot from 'node-telegram-bot-api';

import {AddNewWordFlow} from '../index.js';
import {
  getUserByChatID,
  setUserStepID,
  setUserState,
  User,
  State,
} from '../../repo/users.js';
import {renderNoIdea} from '../../render/renderTextMsg.js';
import {Logger} from 'pino';

const forceAction = async (bot: TelegramBot, user: User, logger: Logger): Promise<void> => {
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
    logger.error({...ctx, err}, 'forceAction error');
    return;
  }
};

const forceTransition = async (bot: TelegramBot, chatID: number, msg: TelegramBot.Message, logger: Logger): Promise<void> => {
  const user = await getUserByChatID(chatID, logger);
  if (user instanceof Error) {
    logger.error({err: user}, 'getUserByChatID error');
    return;
  }
  if (user === null) {
    logger.error(`no user with chatID - ${chatID}`);
    return;
  }

  const {stepID} = user;

  const ctx: {
    stepID: string | null;
    state: State | null;
    userID: string;
    userAnswer: string | undefined;
    newState?: State | null;
  } = {
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
    logger.error({...ctx, err: result}, 'setUserStepID error');
    return;
  }
  result = await setUserState(user._id, newState, logger.child(ctx));
  if (result !== null) {
    logger.error({...ctx, err: result}, 'setUserState error');
    return;
  }
  user.state = newState;
  user.stepID = newStepID;

  return forceAction(bot, user, logger);
};

export {
  forceAction,
  forceTransition,
};
