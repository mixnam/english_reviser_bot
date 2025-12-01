import textToSpeech from '@google-cloud/text-to-speech';

/**
 * module responsible for text-to-speach API
 */
class TTSServiceImpl {
  /**
   * @type {import("@google-cloud/text-to-speech").TextToSpeechClient}
   */
  #client;
  /**
   * @type {string}
   */
  #languageCode;
  #voiceName;

  /**
   * TTSService constructor
   *
   * @param {string} languageCode
   * @param {string} voiceName
   */
  constructor(languageCode, voiceName) {
    this.#client = new textToSpeech.TextToSpeechClient();
    this.#voiceName = voiceName;
    this.#languageCode = languageCode;
  }

  /**
   * @param {string} text
   *
   * @return {Promise<Uint8Array|Error>}
   */
  getAudioForText = async (text) => {
    /**
     * @type {import("@google-cloud/text-to-speech").protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest}
     */
    const request = {
      input: {text},
      voice: {
        languageCode: this.#languageCode,
        name: this.#voiceName,
      },
      audioConfig: {audioEncoding: 'OGG_OPUS'},
    };

    try {
      const [{audioContent}] = await this.#client.synthesizeSpeech(request);
      switch (true) {
        case (audioContent instanceof Uint8Array):
          return audioContent;
        default:
          throw new Error(
              `response.audioContent is not an Uint8Array: it's a ${typeof audioContent}`,
          );
      }
    } catch (err) {
      return new Error(`Can't synthesize speach: ${err}`);
    }
  };
}

let instance;

/**
 * [tech-debt] - remove singleton, support proper DI
 *
 * @returns {TTSServiceImpl}
 */
const getInstance = () => {
  if (!instance) {
    instance = new TTSServiceImpl(
        process.env.LANGUAGE_CODE ?? 'en-US',
        process.env.VOICE_NAME ?? 'en-US-Wavenet-B',
    );
  }
  return instance;
};

const TTSServiceInstance = getInstance();

export {TTSServiceInstance as TTSService};
