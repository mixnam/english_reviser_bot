import TelegramBot from 'node-telegram-bot-api';
import {Command} from './command.js';
import {TTSService} from '../tts/openaiTts.js';
import {renderWordWithCustomStatus} from '../render/renderWord.js';
import {OpenAIExamplesService} from '../services/openAIExamples.js';
import {Logger} from 'pino';

class TestCommand extends Command {
  private bot: TelegramBot;
  private tts: typeof TTSService;

  constructor(bot: TelegramBot, logger: Logger) {
    super(logger);
    this.bot = bot;
    this.tts = TTSService;
  }

  processMsg = async (msg: TelegramBot.Message): Promise<null> => {
    const word = {
      English: 'baixo',
      Translation: 'внизу',
      Examples: null as string | null,
    };

    const example = await OpenAIExamplesService.generateExampleSentence(
        word.English,
        word.Translation,
        'pt-PT',
        this.logger,
    );

    if (example instanceof Error) {
      this.logger.error({err: example}, 'Generate example error');
      return null;
    }

    console.log(example);

    word.Examples = example;

    const audio = await this.tts.getAudioForText(example);

    if (audio instanceof Error) {
      this.logger.error({err: audio}, 'Get audio error');
      return null;
    }

    const msg2 = await this.bot.sendVoice(
        msg.chat.id,
        audio,
        {
          caption: renderWordWithCustomStatus(word as any, 'Test example'),
          parse_mode: 'MarkdownV2',
        },
        {
          filename: 'test.ogg',
          contentType: 'audio/ogg',
        },
    );
    console.log(msg2);
    return null;
  };
}

export {
  TestCommand,
};
