import OpenAI from 'openai';

const LANGUAGE_PROMPTS = {
  en: {
    system: `
You are a simple model, made to generate examples for student studying english. There is always few words on input and you have to  generate simple example - provide one natural short sentence (max 20 words).

INPUT: car 
OUTPUT: My husband just bought a brand new car. 
`,
  },
  pt: {
    system: `
You are a simple model, made to generate examples for student studying european portuguese. There is always few words on input and you have to decide if this word is a verb. If it is, then you generate whole conjunctions of this verb and after that generate simple example - provide one natural short sentence (max 20 words). If this is not a verb, then generate ONLY example sentence and nothing more.

INPUT: vermelho
OUTPUT: O copo de vinho é de um vermelho intenso e profundo. 

INPUT: falar
OUTPUT: 
eu falo, 
tu falas, 
ele/ela fala, 
nós falamos, 
vós falais, 
eles/elas falam
---
Vamos falar sobre o projeto na reunião de amanhã;
`,
  },
};

/**
 * @param {string|undefined} languageCode
 * @return {'en'|'pt'}
 */
const normalizeLanguageCode = (languageCode) => {
  if (!languageCode) {
    return 'en';
  }
  const normalized = languageCode.toLowerCase();
  if (normalized.startsWith('pt')) {
    return 'pt';
  }
  return 'en';
};

/**
 * Small helper around OpenAI chat completions to get a single example sentence
 * for a given English word.
 */
class OpenAIExamplesServiceImpl {
  #client;
  #model;
  #defaultLanguage;

  /**
   * @param {string|undefined} apiKey
   * @param {string|undefined} model
   * @param {string|undefined} baseURL
   * @param {string|undefined} languageCode
   */
  constructor(apiKey, model, baseURL, languageCode) {
    this.#model = model ?? 'gpt-4.1-nano';
    this.#defaultLanguage = normalizeLanguageCode(languageCode);
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
   * @param {string|undefined} languageCode
   * @param {import('../commands/command.js').Logger} [logger]
   * @return {Promise<string|null|Error>}
   */
  generateExampleSentence = async (word, translation, languageCode, logger ) => {
    if (!this.#client) {
      logger?.debug?.('OPENAI_API_KEY is not set, skipping example generation');
      return null;
    }

    const langKey = languageCode ?
      normalizeLanguageCode(languageCode) :
      this.#defaultLanguage;
    const promptConfig = LANGUAGE_PROMPTS[langKey] ?? LANGUAGE_PROMPTS.en;
    try {
      const response = await this.#client.responses.create({
        model: this.#model,
        input: [
          {
            role: 'system',
            content: promptConfig.system,
          },
          {
            role: 'user',
            content: word,
          },
        ],
      });

      const example = this.#extractTextFromResponse(response);
      if (!example) {
        return new Error('[openai] Unable to parse example sentence from response');
      }
      return example.trim();
    } catch (err) {
      return err instanceof Error ? err : new Error(String(err));
    }
  };

  /**
   * @param {import('openai/resources').Responses.Response} response
   * @return {string|null}
   */
  #extractTextFromResponse = (response) => {
    if (!response) {
      return null;
    }

    return response.output_text;
  };
}

let instance;

/**
 * Lazily create singleton to avoid instantiating client without env vars.
 *
 * @returns {OpenAIExamplesServiceImpl}
 */
const getInstance = () => {
  if (!instance) {
    instance = new OpenAIExamplesServiceImpl(
        process.env.OPENAI_API_KEY,
        process.env.OPENAI_EXAMPLE_MODEL,
        process.env.OPENAI_BASE_URL,
        process.env.LANGUAGE_CODE,
    );
  }
  return instance;
};

const OpenAIExamplesServiceInstance = getInstance();

export {OpenAIExamplesServiceInstance as OpenAIExamplesService};
