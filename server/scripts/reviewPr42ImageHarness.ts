import dotenv from 'dotenv';
import {pino} from 'pino';
import cases from './imageSearchEvalCases.json' with {type: 'json'};
import {getInstance as getPlanner} from '../src/services/openAIImageQueryPlanner.js';
import {
  buildDeterministicImageSearchQuery,
  searchImagesForQuery,
} from '../src/services/imageSearchPipeline.js';

dotenv.config({path: '.env.dev'});

type EvalCase = {
  word: string;
  translation: string;
  kind?: string;
};

const logger = pino({level: process.env.PINO_LOG_LEVEL || 'silent'});
const planner = getPlanner();

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const evaluatePath = async (
    word: string,
    translation: string,
    query: string,
) => {
  const results = await searchImagesForQuery(query, logger, 0, 5);
  if (results instanceof Error) {
    return {
      query,
      error: results.message,
    };
  }

  return {
    query,
    candidateCount: results.length,
    top: results.slice(0, 5).map((result, index) => ({
      rank: index + 1,
      title: result.title ?? '',
      displayLink: result.displayLink ?? '',
      url: result.url,
    })),
  };
};

const main = async () => {
  const throttleMs = Number.parseInt(process.env.IMAGE_EVAL_DELAY_MS || '750', 10);
  const report: unknown[] = [];

  for (const testCase of cases as EvalCase[]) {
    const deterministicQuery = buildDeterministicImageSearchQuery(testCase.word, testCase.translation);
    const planned = await planner.plan(testCase.word, testCase.translation, logger);
    const plannedQuery = planned?.query ?? null;

    const llmPlannedPath = plannedQuery ?
      await evaluatePath(testCase.word, testCase.translation, plannedQuery) :
      {query: null, error: 'Planner unavailable'};
    if (throttleMs > 0) await delay(throttleMs);
    const deterministicPath = await evaluatePath(testCase.word, testCase.translation, deterministicQuery);

    report.push({
      word: testCase.word,
      translation: testCase.translation,
      kind: testCase.kind ?? null,
      plannerUsed: Boolean(plannedQuery),
      plannerIntent: planned?.intent ?? null,
      plannerConfidence: planned?.confidence ?? null,
      plannedQuery,
      deterministicQuery,
      llmPlannedPath,
      deterministicPath,
    });

    if (throttleMs > 0) await delay(throttleMs);
  }

  console.log(JSON.stringify(report, null, 2));
};

await main();
