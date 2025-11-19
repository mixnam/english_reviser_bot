const {OpenAI} = require('openai');

/**
 * OpenAI Text-to-Speech service that mirrors the Google TTS interface.
 */
class OpenAITTSService {
  #client;
  #model;
  #voiceName;
  #format;

  /**
   * @param {string|undefined} apiKey
   * @param {string|undefined} model
   * @param {string|undefined} voiceName
   * @param {import("openai/resources/audio/speech").SpeechCreateParams["response_format"]} format
   */
  constructor(apiKey, model, voiceName, format) {
    this.#model = model ?? 'gpt-4o-mini-tts';
    this.#voiceName = voiceName ?? 'alloy';
    this.#format = format ?? 'opus';
    this.#client = apiKey ? new OpenAI({apiKey}) : null;
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
    );
  }
  return instance;
};

module.exports = {
  TTSService: getInstance(),
};
