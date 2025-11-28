import OpenAI from 'openai';

/**
 * OpenAI Text-to-Speech service that mirrors the Google TTS interface.
 */
class OpenAITTSService {
  #client;
  #model;
  #voiceName;
  #format;
  #languageCode;
  #instructions;

  /**
   * @param {string|undefined} apiKey
   * @param {string|undefined} model
   * @param {string|undefined} voiceName
   * @param {import("openai/resources/audio/speech").SpeechCreateParams["response_format"]} format
   * @param {string|undefined} languageCode
   * @param {string|undefined} instructions
   */
  constructor(apiKey, model, voiceName, format, languageCode, instructions) {
    this.#model = model ?? 'gpt-4o-mini-tts';
    this.#languageCode = languageCode ?? 'en';
    this.#voiceName = voiceName ?? this.#resolveDefaultVoice();
    this.#format = format ?? 'opus';
    this.#instructions = instructions ?? this.#resolveDefaultInstructions();
    this.#client = apiKey ? new OpenAI({apiKey}) : null;
  }

  /**
   * Pick a default voice based on language when explicit override not provided.
   * @return {string}
   */
  #resolveDefaultVoice() {
    const language = this.#languageCode.toLowerCase();
    if (language.startsWith('pt')) {
      return 'alloy'; // Base timbre still works, accent handled via instructions.
    }
    return 'alloy';
  }

  /**
   * Provide accent/style instructions when OpenAI voice presets are too generic.
   * @return {string|undefined}
   */
  #resolveDefaultInstructions() {
    const language = this.#languageCode?.toLowerCase();
    if (!language) return undefined;

    if (language === 'pt-pt' || language === 'pt') {
      return 'Speak in native European Portuguese (Portugal) accent. Not Brazilian. Speak a bit slower than a regular native speaker';
    }
    return undefined;
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
      const payload = {
        model: this.#model,
        voice: this.#voiceName,
        input: text,
        response_format: this.#format,
      };

      if (this.#instructions) {
        payload.instructions = this.#instructions;
      }

      const speech = await this.#client.audio.speech.create(payload);

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
        process.env.OPENAI_TTS_INSTRUCTIONS,
    );
  }
  return instance;
};

export const TTSService = getInstance();
