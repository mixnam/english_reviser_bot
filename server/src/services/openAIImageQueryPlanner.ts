import OpenAI from 'openai';
import {Responses} from 'openai/resources/index';
import {Logger} from 'pino';

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

const SYSTEM_PROMPT = `You plan image-search intent for vocabulary study.
Return ONLY valid JSON with keys: intent, confidence, candidates.
intent must be one of: object, action, mixed, unknown.
confidence must be a number from 0 to 1.
candidates must be a short array (1 to 3) of objects with subject and optional scene/styleHint.
No markdown, no commentary, no raw search syntax, no operators, no URLs.`;

const clampConfidence = (value: unknown): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
};

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

      const raw = this.extractTextFromResponse(response)?.trim();
      if (!raw) return null;

      const parsed = JSON.parse(raw) as Partial<ImageQueryPlan>;
      const intent = this.normalizeIntent(parsed.intent);
      const confidence = clampConfidence(parsed.confidence);
      const candidates = Array.isArray(parsed.candidates)
        ? parsed.candidates
            .filter((candidate): candidate is ImageQueryCandidate =>
              !!candidate
              && typeof candidate === 'object'
              && typeof candidate.subject === 'string'
              && candidate.subject.trim().length > 0,
            )
            .slice(0, 3)
        : [];

      if (confidence < this.minConfidence || candidates.length === 0) return null;
      return {intent, confidence, candidates};
    } catch (err) {
      logger?.warn?.({err}, 'Image query planning failed');
      return null;
    }
  };

  private normalizeIntent = (intent: unknown): ImageSearchIntent => {
    if (intent === 'object' || intent === 'action' || intent === 'mixed' || intent === 'unknown') {
      return intent;
    }
    return 'unknown';
  };

  private extractTextFromResponse = (response: Responses.Response): string | null => {
    return response?.output_text ?? null;
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
