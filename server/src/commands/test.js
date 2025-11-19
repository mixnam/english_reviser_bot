// eslint-disable-next-line
// @ts-nocheck 


// const TelegramBot = require('node-telegram-bot-api');
const {Command} = require('./command');
// const {getUserByChatID, setUserStepID} = require('../repo/users');
// const AddNewWord = require('../flows/steps/addNewWordStep');
// const {forceAction} = require('../flows/processor');
// const {getSpelcheckSuggestions} = require('../repo/words');
const {TTSService} = require('../tts/openaiTts');
const {renderWordWithCustomStatus} = require('../render/renderWord');
const {OpenAIExamplesService} = require('../services/openAIExamples');


/**
 * TextDBCommand
 */
class TestCommand extends Command {
  #bot;
  #tts;

  /**
   * ReviseCommand constructor
   * @param {TelegramBot} bot
   * @param {import('./command').Logger} logger
   */
  constructor(bot, logger) {
    super(logger);
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
    const word = {
      English: 'baixo',
      Translation: 'внизу',
      Examples: null,
    };

    const example = await OpenAIExamplesService.generateExampleSentence(
        word.English,
        word.Translation,
        'pt-PT',
        this.logger,
    );

    if (example instanceof Error) {
      this.logger.error(example);
      return;
    }

    console.log(example);

    word.Examples = example;

    const audio = await this.#tts.getAudioForText(example);

    if (audio instanceof Error) {
      this.logger.error(audio);
      return;
    }

    const msg2 = await this.#bot.sendVoice(
        msg.chat.id,
        audio,
        {
          caption: renderWordWithCustomStatus(word, 'Test example'),
          parse_mode: 'MarkdownV2',
        },
        {
          filename: 'test.ogg',
          contentType: 'audio/ogg',
        },
    );
    console.log(msg2);
  };
}

module.exports = {
  TestCommand,
};
