import OpenAI from 'openai';
import {Logger} from 'pino';

class OpenAIImageServiceImpl {
  private client: OpenAI | null;
  private model: string;

  constructor(
      apiKey?: string,
      model?: string,
      baseURL?: string,
  ) {
    this.model = model ?? 'dall-e-3';
    this.client = apiKey ?
      new OpenAI({
        apiKey,
        ...(baseURL ? {baseURL} : {}),
      }) :
      null;
  }

  generateImage = async (
      word: string,
      translation: string,
      logger: Logger,
  ): Promise<string | Buffer | null | Error> => {
    if (!this.client) {
      logger?.debug?.('OPENAI_API_KEY is not set, skipping image generation');
      return null;
    }

    const start = Date.now();
    logger.info({model: this.model, word}, '[openai] generating image with model');

    try {
      const prompt = `A simple, iconic illustration representing the word '${word}' (meaning: ${translation}). Minimalist, clear, white background.`;

      const params: OpenAI.Images.ImageGenerateParams = {
        model: this.model,
        prompt: prompt,
        n: 1,
        size: '1024x1024',
      };

      if (this.model !== 'gpt-image-1') {
        params.response_format = 'url';
      }

      const response = await this.client.images.generate(params);

      if (this.model === 'gpt-image-1') {
        const b64Json = response.data[0]?.b64_json;
        if (!b64Json) {
          // Fallback: sometimes models behave unexpectedly, check url just in case or error out
          if (response.data[0]?.url) return response.data[0].url;
          return new Error('[openai] Unable to parse image data (b64_json) from response');
        }
        logger.info({duration: Date.now() - start}, '[openai] image generated (buffer)');
        return Buffer.from(b64Json, 'base64');
      }

      const imageUrl = response.data[0]?.url;
      if (!imageUrl) {
        return new Error('[openai] Unable to parse image URL from response');
      }

      logger.info({duration: Date.now() - start}, '[openai] image generated (url)');
      return imageUrl;
    } catch (err) {
      const duration = Date.now() - start;
      // Check for content policy violation or other specific errors
      if (err instanceof OpenAI.APIError && err.status === 400) {
        // Attempt to parse the error message for more details
        const errorDetails = (err.error as any)?.message || 'Content policy violation or invalid request.';
        logger.warn({err: err, word, translation, duration}, `OpenAI image generation failed: ${errorDetails}`);
        return new Error(`[openai] Image generation failed: ${errorDetails}`);
      }
      logger.error({err: err, word, translation, duration}, 'OpenAI image generation failed');
      return err instanceof Error ? err : new Error(String(err));
    }
  };
}

let instance: OpenAIImageServiceImpl;

const getInstance = (): OpenAIImageServiceImpl => {
  if (!instance) {
    instance = new OpenAIImageServiceImpl(
        process.env.OPENAI_API_KEY,
        process.env.OPENAI_IMAGE_MODEL,
        process.env.OPENAI_BASE_URL,
    );
  }
  return instance;
};


export {getInstance};
