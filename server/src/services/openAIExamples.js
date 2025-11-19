const {OpenAI} = require('openai');

/**
 * Small helper around OpenAI chat completions to get a single example sentence
 * for a given English word.
 */
class OpenAIExamplesService {
  #client;
  #model;

  /**
   * @param {string|undefined} apiKey
   * @param {string|undefined} model
   * @param {string|undefined} baseURL
   */
  constructor(apiKey, model, baseURL) {
    this.#model = model ?? 'gpt-3.5-turbo';
    this.#client = apiKey ?
      new OpenAI({
        apiKey,
        ...(baseURL ? {baseURL} : {}),
      }) :
      null;
  }

  /**
   * @param {string} word
   * @param {string|undefined} translation
   * @param {import('../commands/command').Logger} [logger]
   * @return {Promise<string|null|Error>}
   */
  generateExampleSentence = async (word, translation, logger) => {
    if (!this.#client) {
      logger?.debug?.('OPENAI_API_KEY is not set, skipping example generation');
      return null;
    }

    try {
      const response = await this.#client.chat.completions.create({
        model: this.#model,
        temperature: 0.4,
        max_tokens: 120,
        messages: [
          {
            role: 'system',
            content: 'You craft concise English example sentences to help memorize words. Reply with a single sentence and nothing else.',
          },
          {
            role: 'user',
            content: this.#buildPrompt(word, translation),
          },
        ],
      });

      const example = response?.choices?.[0]?.message?.content?.trim();
      if (!example) {
        return new Error('[openai] Unable to parse example sentence from response');
      }
      return example.replace(/\s+/g, ' ').trim();
    } catch (err) {
      return err instanceof Error ? err : new Error(String(err));
    }
  };

  /**
   * @param {string} word
   * @param {string|undefined} translation
   * @return {string}
   */
  #buildPrompt = (word, translation) => {
    const translationPart = translation ?
      ` The learner translated it as "${translation}".` :
      '';
    return `Provide one natural short sentence (max 20 words) that uses the English word "${word}".${translationPart} Return only the sentence.`;
  };
}

let instance;

/**
 * Lazily create singleton to avoid instantiating client without env vars.
 *
 * @returns {OpenAIExamplesService}
 */
const getInstance = () => {
  if (!instance) {
    instance = new OpenAIExamplesService(
        process.env.OPENAI_API_KEY,
        process.env.OPENAI_EXAMPLE_MODEL,
        process.env.OPENAI_BASE_URL,
    );
  }
  return instance;
};

module.exports = {
  OpenAIExamplesService: getInstance(),
};
