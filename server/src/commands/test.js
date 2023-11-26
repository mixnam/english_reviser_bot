// eslint-disable-next-line
const TelegramBot = require('node-telegram-bot-api');
const {Command} = require('./command');
const {getUserByChatID, setUserStepID} = require('../repo/users');
const AddNewWord = require('../flows/steps/addNewWordStep');
const {forceAction} = require('../flows/processor');
const {getSpelcheckSuggestions} = require('../repo/words');
const {TTSService} = require('../tts/tts');
const {renderWordWithCustomStatus} = require('../render/renderWord');


/**
 * TextDBCommand
 */
class TestCommand extends Command {
  #bot;
  #tts;

  /**
   * ReviseCommand constructor
   * @param {TelegramBot} bot
   */
  constructor(bot) {
    super();
    this.#bot = bot;
    this.#tts = TTSService;
  }

  /**
   * @param {TelegramBot.Message} msg
   */
  processMsg = async (msg) => {
    // const user = await this.getSessionUser(msg);
    // if (user instanceof Error) {
    //   console.error(user);
    //   return;
    // }

    // const word = await getRandomWordByUserIDForRevise(user._id);
    const text = 'Hello motherfucker';

    const audio = await this.#tts.getAudioForText(text);
    const data = this.#bot._formatSendData('voice', audio );
    console.log(data);

    const msg2 = await this.#bot.sendVoice(msg.chat.id, audio, {
      caption: renderWordWithCustomStatus({
        English: 'Fuck',
        Translation: 'you',
      }, 'Ha'),
      parse_mode: 'MarkdownV2',
    }, {
      filename: 'test',
    });
    console.log(msg2);
  };
}

module.exports = {
  TestCommand,
};
