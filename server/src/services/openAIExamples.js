const {OpenAI} = require('openai');

const LANGUAGE_PROMPTS = {
  en: {
    system: 'You craft concise English example sentences to help learners memorize vocabulary. Reply with a single sentence and nothing else.',
    /**
     * @param {string} word
     * @param {string|undefined} translation
     * @return {string}
     */
    buildPrompt: (word, translation) => {
      const translationPart = translation ?
        ` The learner translated it as "${translation}".` :
        '';
      return `Provide one natural short sentence (max 20 words) that uses the English word "${word}".${translationPart} Return only the sentence.`;
    },
  },
  pt: {
    system: 'Você ajuda estudantes lusófonos a memorizar vocabulário português. Sempre analise a palavra fornecida, responda em português nativo e mantenha o formato solicitado ao exibir conjugações e exemplos.',
    /**
     * @param {string} word
     * @param {string|undefined} translation
     * @return {string}
     */
    buildPrompt: (word, translation) => {
      const translationPart = translation ?
        ` O aluno associou a tradução "${translation}".` :
        '';
      return `
Analise a palavra "${word}" e determine se é um verbo em português.
Formato a obedecer SEMPRE (inclua o caracter de quebra de linha "\n" entre cada parte):
- (opcional) conjugações: cada pessoa do presente do indicativo em sua própria linha de texto (eu ..., tu ..., etc.).
- uma linha contendo apenas "---".
- uma linha final com uma única frase curta (máximo de 20 palavras) em português europeu usando "${word}" num contexto natural.${translationPart}
Se for verbo, preencha todas as 6 linhas de conjugações antes da linha "---".
Se não for verbo, não escreva conjugações; comece diretamente com  a frase.
Não inclua traduções, comentários ou texto adicional fora desse formato.
Exemple para a palavra "falar":

eu falo, 
tu falas, 
ele/ela fala, 
nós falamos, 
vós falais, 
eles/elas falam
---
Vamos falar sobre o projeto na reunião de amanhã
`;
    },
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
class OpenAIExamplesService {
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
   * @param {import('../commands/command').Logger} [logger]
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
            content: promptConfig.buildPrompt(word, translation),
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
 * @returns {OpenAIExamplesService}
 */
const getInstance = () => {
  if (!instance) {
    instance = new OpenAIExamplesService(
        process.env.OPENAI_API_KEY,
        process.env.OPENAI_EXAMPLE_MODEL,
        process.env.OPENAI_BASE_URL,
        process.env.LANGUAGE_CODE,
    );
  }
  return instance;
};

module.exports = {
  OpenAIExamplesService: getInstance(),
};
