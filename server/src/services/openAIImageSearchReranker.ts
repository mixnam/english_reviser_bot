import OpenAI from 'openai';
import {Logger} from 'pino';
import {z} from 'zod';
import type {GoogleImageSearchResult} from './googleImage.js';

export type ImageSearchCandidate = GoogleImageSearchResult & {
  query: string;
  rankHint: number;
};

export type ImageRerankResult = {
  orderedUrls: string[];
  reasoning?: string;
};

const ImageRerankSchema = z.object({
  orderedUrls: z.array(z.string().url()).min(1).max(20),
  reasoning: z.string().min(1).max(240).optional(),
});

const SYSTEM_PROMPT = `You rerank image-search results for a vocabulary learning app.
Return ONLY valid JSON with keys: orderedUrls and optional reasoning.
Choose images that best depict the meaning of the target word for a learner.
Prefer literal, visually clear, representative images.
Avoid grammar pages, vocabulary worksheets, logos, icons, posters, low-information graphics, celebrity photos, and unrelated stock art.
Use the candidate metadata: query, title, snippet, source domain, and page URL.
Do not invent URLs. orderedUrls must be a subset of the provided candidate URLs.`;

class OpenAIImageSearchRerankerImpl {
  private client: OpenAI | null;
  private model: string;

  constructor(apiKey?: string, model?: string, baseURL?: string) {
    this.model = model ?? 'gpt-4.1-mini';
    this.client = apiKey ? new OpenAI({apiKey, ...(baseURL ? {baseURL} : {})}) : null;
  }

  rerank = async (
      word: string,
      translation: string,
      candidates: ImageSearchCandidate[],
      logger: Logger,
  ): Promise<ImageRerankResult | null> => {
    if (!this.client) {
      logger?.debug?.('OPENAI_API_KEY is not set, skipping image reranking');
      return null;
    }

    if (candidates.length === 0) return {orderedUrls: []};

    try {
      const response = await this.client.responses.create({
        model: this.model,
        input: [
          {role: 'system', content: SYSTEM_PROMPT},
          {
            role: 'user',
            content: JSON.stringify({
              word,
              translation,
              candidates: candidates.map((candidate) => ({
                url: candidate.url,
                query: candidate.query,
                title: candidate.title ?? '',
                snippet: candidate.snippet ?? '',
                displayLink: candidate.displayLink ?? '',
                contextLink: candidate.contextLink ?? '',
                mime: candidate.mime ?? '',
                width: candidate.width ?? null,
                height: candidate.height ?? null,
                rankHint: candidate.rankHint,
              })),
            }),
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'image_rerank',
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                orderedUrls: {
                  type: 'array',
                  minItems: 1,
                  maxItems: 20,
                  items: {type: 'string', format: 'uri'},
                },
                reasoning: {type: 'string', minLength: 1, maxLength: 240},
              },
              required: ['orderedUrls'],
            },
          },
        },
      });

      const raw = response.output_text?.trim();
      if (!raw) return null;

      const parsed = ImageRerankSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) {
        logger?.warn?.({issues: parsed.error.issues}, 'Image rerank validation failed');
        return null;
      }

      const allowedUrls = new Set(candidates.map((candidate) => candidate.url));
      const orderedUrls = parsed.data.orderedUrls.filter((url, index, arr) => allowedUrls.has(url) && arr.indexOf(url) === index);
      if (orderedUrls.length === 0) return null;

      return {
        orderedUrls,
        reasoning: parsed.data.reasoning,
      };
    } catch (err) {
      logger?.warn?.({err}, 'Image reranking failed');
      return null;
    }
  };
}

let instance: OpenAIImageSearchRerankerImpl;

const getInstance = (): OpenAIImageSearchRerankerImpl => {
  if (!instance) {
    instance = new OpenAIImageSearchRerankerImpl(
      process.env.OPENAI_API_KEY,
      process.env.OPENAI_IMAGE_RERANK_MODEL,
      process.env.OPENAI_BASE_URL,
    );
  }
  return instance;
};

export {getInstance};
