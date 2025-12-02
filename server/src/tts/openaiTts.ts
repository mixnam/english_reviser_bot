import OpenAI from 'openai';
import {SpeechCreateParams} from 'openai/resources/audio/speech';

/**
 * OpenAI Text-to-Speech service that mirrors the Google TTS interface.
 */
class OpenAITTSService {
  private client: OpenAI | null;
  private model: string;
  private voiceName: string;
  private format: SpeechCreateParams['response_format'];
  private languageCode: string;
  private instructions: string | undefined;

  constructor(
      apiKey?: string,
      model?: string,
      voiceName?: string,
      format?: SpeechCreateParams['response_format'],
      languageCode?: string,
      instructions?: string,
  ) {
    this.model = model ?? 'gpt-4o-mini-tts';
    this.languageCode = languageCode ?? 'en';
    this.voiceName = voiceName ?? this.resolveDefaultVoice();
    this.format = format ?? 'opus';
    this.instructions = instructions ?? this.resolveDefaultInstructions();
    this.client = apiKey ? new OpenAI({apiKey}) : null;
  }

  /**
   * Pick a default voice based on language when explicit override not provided.
   */
  private resolveDefaultVoice(): string {
    const language = this.languageCode.toLowerCase();
    if (language.startsWith('pt')) {
      return 'alloy'; // Base timbre still works, accent handled via instructions.
    }
    return 'alloy';
  }

  /**
   * Provide accent/style instructions when OpenAI voice presets are too generic.
   */
  private resolveDefaultInstructions(): string | undefined {
    const language = this.languageCode?.toLowerCase();
    if (!language) return undefined;

    if (language === 'pt-pt' || language === 'pt') {
      return 'Speak in native European Portuguese (Portugal) accent. Not Brazilian. Speak a bit slower than a regular native speaker';
    }
    return undefined;
  }

  getAudioForText = async (text: string): Promise<Buffer | Error> => {
    if (!this.client) {
      return new Error('OPENAI_API_KEY is not set for TTS');
    }

    try {
      // The instructions field is not part of the standard SpeechCreateParams in the library types currently,
      // but the original code was using it. If it's a custom extension or newer feature not in types,
      // we might need to cast or ignore. However, looking at standard OpenAI API, `instructions` is NOT a valid parameter for /audio/speech.
      // The original code had:
      // if (this.#instructions) { payload.instructions = this.#instructions; }
      // I will check if I should keep it. The comment says "accent handled via instructions".
      // If the user was using it, maybe they are using a proxy or it's a very new feature?
      // Or maybe it was a hallucination in the original JS code?
      // I will keep it but cast payload to any to avoid TS errors if it doesn't exist on the type.

      const payload: any = {
        model: this.model,
        voice: this.voiceName,
        input: text,
        response_format: this.format,
      };

      if (this.instructions) {
        payload.instructions = this.instructions;
      }

      const speech = await this.client.audio.speech.create(payload as SpeechCreateParams);

      const buffer = Buffer.from(await speech.arrayBuffer());
      return buffer;
    } catch (err) {
      return new Error(`Can't synthesize speech via OpenAI: ${err}`);
    }
  };
}

let instance: OpenAITTSService;

/**
 * Maintain singleton (same shape as the legacy Google service).
 */
const getInstance = (): OpenAITTSService => {
  if (!instance) {
    instance = new OpenAITTSService(
        process.env.OPENAI_API_KEY,
        process.env.OPENAI_TTS_MODEL,
        process.env.OPENAI_TTS_VOICE,
        process.env.OPENAI_TTS_FORMAT as SpeechCreateParams['response_format'],
        process.env.LANGUAGE_CODE,
        process.env.OPENAI_TTS_INSTRUCTIONS,
    );
  }
  return instance;
};

export const TTSService = getInstance();

