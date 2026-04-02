import OpenAI from 'openai';
import {Logger} from 'pino';
import {z} from 'zod';

export type ImageSearchIntent = 'object' | 'action' | 'mixed' | 'unknown';
export type ImageQueryPlan = {
  intent: ImageSearchIntent;
  confidence: number;
  queries: string[];
};

const ImageQueryPlanSchema = z.object({
  intent: z.enum(['object', 'action', 'mixed', 'unknown']),
  confidence: z.number().min(0).max(1),
  queries: z.array(z.string().min(1).max(120)).min(1).max(5),
});

const SYSTEM_PROMPT = `You plan image-search queries for a vocabulary study app.
Return ONLY valid JSON with keys: intent, confidence, queries.
intent must be one of: object, action, mixed, unknown.
confidence must be a number from 0 to 1.
queries must be an array of 1 to 5 ready-to-use image search queries.
Each query should be short, concrete, and optimized to find a representative image for the target meaning.
Prefer sense-disambiguated queries using the translation when helpful.
For verbs and adjectives, prefer visually depictable scenes.
No markdown, no commentary, no operators, no URLs, no quotes.`;

class OpenAIImageQueryPlannerImpl {
  private client: OpenAI | null;
  private model: string;
  private minConfidence: number;

  constructor(apiKey?: string, model?: string, baseURL?: string, minConfidence?: number) {
    this.model = model ?? 'gpt-4.1-mini';
    this.minConfidence = typeof minConfidence === 'number' ? minConfidence : 0.65;
    this.client = apiKey ? new OpenAI({apiKey, ...(baseURL ? {baseURL} : {})}) : null;
  }

  plan = async (
      word: string,
      translation: string,
      logger: Logger,
  ): Promise<ImageQueryPlan | null> => {
    if (!this.client) {
      logger?.debug?.('OPENAI_API_KEY is not set, skipping image query planning');
      return null;
    }

    try {
      const response = await this.client.responses.create({
        model: this.model,
        input: [
          {role: 'system', content: SYSTEM_PROMPT},
          {role: 'user', content: JSON.stringify({word, translation})},
        ],
      });

      const raw = response.output_text?.trim();
      if (!raw) return null;

      const parsed = ImageQueryPlanSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) {
        logger?.warn?.({issues: parsed.error.issues}, 'Image query plan validation failed');
        return null;
      }

      if (parsed.data.confidence < this.minConfidence) return null;

      return {
        ...parsed.data,
        queries: [...new Set(parsed.data.queries.map((query) => query.trim()).filter(Boolean))].slice(0, 5),
      };
    } catch (err) {
      logger?.warn?.({err}, 'Image query planning failed');
      return null;
    }
  };
}

let instance: OpenAIImageQueryPlannerImpl;

const getInstance = (): OpenAIImageQueryPlannerImpl => {
  if (!instance) {
    instance = new OpenAIImageQueryPlannerImpl(
        process.env.OPENAI_API_KEY,
        process.env.OPENAI_IMAGE_QUERY_MODEL,
        process.env.OPENAI_BASE_URL,
        process.env.OPENAI_IMAGE_QUERY_MIN_CONFIDENCE ?
          Number.parseFloat(process.env.OPENAI_IMAGE_QUERY_MIN_CONFIDENCE) :
          undefined,
    );
  }
  return instance;
};

export {getInstance};
