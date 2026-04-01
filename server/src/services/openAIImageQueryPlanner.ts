import OpenAI from 'openai';
import {Logger} from 'pino';
import {z} from 'zod';

export type ImageQueryPlan = {
  intent: 'object' | 'action' | 'mixed' | 'unknown';
  confidence: number;
  queries: string[];
  reasoning?: string;
};

const ImageQueryPlanSchema = z.object({
  intent: z.enum(['object', 'action', 'mixed', 'unknown']),
  confidence: z.number().min(0).max(1),
  queries: z.array(z.string().min(1).max(120)).min(1).max(4),
  reasoning: z.string().min(1).max(200).optional(),
});

const SYSTEM_PROMPT = `You plan image-search intent for vocabulary study.
Return ONLY valid JSON with keys: intent, confidence, queries, reasoning.
intent must be one of: object, action, mixed, unknown.
confidence must be a number from 0 to 1.
queries must be a short array of 1 to 4 plain-language image search queries.
Prefer concrete visual phrases that would retrieve a representative picture for the meaning.
For verbs/adjectives, prefer visually depictable scenes over dictionary or grammar pages.
Keep queries short. No quotes, no site operators, no boolean operators, no URLs.
No markdown, no commentary, no raw search syntax, no operators, no URLs.`;

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
        text: {
          format: {
            type: 'json_schema',
            name: 'image_query_plan',
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                intent: {type: 'string', enum: ['object', 'action', 'mixed', 'unknown']},
                confidence: {type: 'number', minimum: 0, maximum: 1},
                queries: {
                  type: 'array',
                  minItems: 1,
                  maxItems: 4,
                  items: {type: 'string', minLength: 1, maxLength: 120},
                },
                reasoning: {type: 'string', minLength: 1, maxLength: 200},
              },
              required: ['intent', 'confidence', 'queries'],
            },
          },
        },
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
        queries: [...new Set(parsed.data.queries.map((query) => query.trim()).filter(Boolean))].slice(0, 4),
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
      process.env.OPENAI_IMAGE_QUERY_MIN_CONFIDENCE
        ? Number.parseFloat(process.env.OPENAI_IMAGE_QUERY_MIN_CONFIDENCE)
        : undefined,
    );
  }
  return instance;
};

export {getInstance};
