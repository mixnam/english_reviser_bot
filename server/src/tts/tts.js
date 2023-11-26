const textToSpeech = require('@google-cloud/text-to-speech');

/**
 * module responsible for text-to-speach API
 */
class TTSService {
  /**
   * @type {textToSpeech.TextToSpeechClient}
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
     * @type {textToSpeech.protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest}
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
 * @return {TTSService}
 */
const getInstance = () => {
  if (!instance) {
    instance = new TTSService(
        process.env.LANGUAGE_CODE,
        process.env.VOICE_NAME,
    );
  }
  return instance;
};

module.exports = {
  TTSService: getInstance(),
};
