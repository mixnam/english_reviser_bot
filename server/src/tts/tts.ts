import * as gcTTS from '@google-cloud/text-to-speech';

/**
 * module responsible for text-to-speech API
 */
class TTSServiceImpl {
  private client: gcTTS.TextToSpeechClient;
  private languageCode: string;
  private voiceName: string;

  /**
   * TTSService constructor
   */
  constructor(languageCode: string, voiceName: string) {
    this.client = new gcTTS.TextToSpeechClient();
    this.voiceName = voiceName;
    this.languageCode = languageCode;
  }

  getAudioForText = async (text: string): Promise<Uint8Array | Error> => {
    const request: gcTTS.protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest = {
      input: {text},
      voice: {
        languageCode: this.languageCode,
        name: this.voiceName,
      },
      audioConfig: {audioEncoding: 'OGG_OPUS'},
    };

    try {
      const [response] = await this.client.synthesizeSpeech(request);
      const audioContent = response.audioContent;

      if (audioContent instanceof Uint8Array) {
        return audioContent;
      }

      // It might be a string (base64) or null depending on the generated client version,
      // but usually the client returns Buffer (Uint8Array) for binary fields.
      // If it is a string/buffer, we might need to handle it.
      // The original code checked strictly for Uint8Array.
      // In nodejs environment, Buffer is Uint8Array.

      throw new Error(
          `response.audioContent is not an Uint8Array: it's a ${typeof audioContent}`,
      );
    } catch (err) {
      return new Error(`Can't synthesize speach: ${err}`);
    }
  };
}

let instance: TTSServiceImpl;

/**
 * [tech-debt] - remove singleton, support proper DI
 */
const getInstance = (): TTSServiceImpl => {
  if (!instance) {
    instance = new TTSServiceImpl(
        process.env.LANGUAGE_CODE ?? 'en-US',
        process.env.VOICE_NAME ?? 'en-US-Wavenet-B',
    );
  }
  return instance;
};

// Kill it
const TTSServiceInstance = getInstance();

export {TTSServiceInstance as TTSService};

