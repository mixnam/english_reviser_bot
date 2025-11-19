const {OpenAI} = require('openai');

/**
 * OpenAI Text-to-Speech service that mirrors the Google TTS interface.
 */
class OpenAITTSService {
  #client;
  #model;
  #voiceName;
  #format;
  #languageCode;

  /**
   * @param {string|undefined} apiKey
   * @param {string|undefined} model
   * @param {string|undefined} voiceName
   * @param {import("openai/resources/audio/speech").SpeechCreateParams["response_format"]} format
   * @param {string|undefined} languageCode
   */
  constructor(apiKey, model, voiceName, format, languageCode) {
    this.#model = model ?? 'gpt-4o-mini-tts';
    this.#languageCode = languageCode ?? 'en';
    this.#voiceName = voiceName ?? this.#resolveDefaultVoice();
    this.#format = format ?? 'opus';
    this.#client = apiKey ? new OpenAI({apiKey}) : null;
  }

  /**
   * Pick a default voice based on language when explicit override not provided.
   * @return {string}
   */
  #resolveDefaultVoice() {
    const language = this.#languageCode.toLowerCase();
    if (language.startsWith('pt')) {
      return 'luna'; // European Portuguese voice
    }
    return 'alloy';
  }

  /**
   * @param {string} text
   * @return {Promise<Uint8Array|Error>}
   */
  getAudioForText = async (text) => {
    if (!this.#client) {
      return new Error('OPENAI_API_KEY is not set for TTS');
    }

    try {
      const speech = await this.#client.audio.speech.create({
        model: this.#model,
        voice: this.#voiceName,
        input: text,
        response_format: this.#format,
      });

      const buffer = Buffer.from(await speech.arrayBuffer());
      return buffer;
    } catch (err) {
      return new Error(`Can't synthesize speech via OpenAI: ${err}`);
    }
  };
}

let instance;

/**
 * Maintain singleton (same shape as the legacy Google service).
 *
 * @returns {OpenAITTSService}
 */
const getInstance = () => {
  if (!instance) {
    instance = new OpenAITTSService(
        process.env.OPENAI_API_KEY,
        process.env.OPENAI_TTS_MODEL,
        process.env.OPENAI_TTS_VOICE,
        // @ts-ignore
        process.env.OPENAI_TTS_FORMAT,
        process.env.LANGUAGE_CODE,
    );
  }
  return instance;
};

module.exports = {
  TTSService: getInstance(),
};
