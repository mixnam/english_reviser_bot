import OpenAI from 'openai';
import {Logger} from 'pino';
import {z} from 'zod';

export type ImageSearchIntent = 'object' | 'action' | 'mixed' | 'unknown';
export type ImageQueryCandidate = {
  subject: string;
  scene?: string;
  styleHint?: string;
};
export type ImageQueryPlan = {
  intent: ImageSearchIntent;
  confidence: number;
  candidates: ImageQueryCandidate[];
};

const ImageQueryPlanSchema = z.object({
  intent: z.enum(['object', 'action', 'mixed', 'unknown']),
  confidence: z.number().min(0).max(1),
  candidates: z.array(z.object({
    subject: z.string().min(1).max(80),
    scene: z.string().min(1).max(80).optional(),
    styleHint: z.string().min(1).max(40).optional(),
  })).min(1).max(3),
});

const SYSTEM_PROMPT = `You plan image-search intent for vocabulary study.
Return ONLY valid JSON with keys: intent, confidence, candidates.
intent must be one of: object, action, mixed, unknown.
confidence must be a number from 0 to 1.
candidates must be a short array (1 to 3) of objects with subject and optional scene/styleHint.
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
      });

      const raw = response.output_text?.trim();
      if (!raw) return null;

      const parsed = ImageQueryPlanSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) {
        logger?.warn?.({issues: parsed.error.issues}, 'Image query plan validation failed');
        return null;
      }

      if (parsed.data.confidence < this.minConfidence) return null;
      return parsed.data;
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
