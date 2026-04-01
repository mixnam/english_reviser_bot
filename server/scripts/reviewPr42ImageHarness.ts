import dotenv from 'dotenv';
import {pino} from 'pino';
import cases from './imageSearchEvalCases.json' with {type: 'json'};
import {getInstance as getPlanner} from '../src/services/openAIImageQueryPlanner.js';
import {getInstance as getReranker} from '../src/services/openAIImageSearchReranker.js';
import {
  buildDeterministicImageSearchQueries,
  collectImageSearchCandidates,
  deterministicFallbackScore,
  orderImageCandidates,
  type RankedImageSearchCandidate,
} from '../src/services/imageSearchPipeline.js';

dotenv.config({path: '.env.dev'});

type EvalCase = {
  word: string;
  translation: string;
  kind?: string;
};

const logger = pino({level: process.env.PINO_LOG_LEVEL || 'silent'});
const planner = getPlanner();
const reranker = getReranker();

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const summarizeCandidates = (
    word: string,
    translation: string,
    candidates: RankedImageSearchCandidate[],
    orderedUrls: string[],
) => {
  const scoreByUrl = new Map(
    candidates.map((candidate) => [candidate.url, deterministicFallbackScore(candidate, word, translation)]),
  );
  const candidateByUrl = new Map(candidates.map((candidate) => [candidate.url, candidate]));

  return orderedUrls.slice(0, 5).map((url, index) => {
    const candidate = candidateByUrl.get(url);
    return {
      rank: index + 1,
      query: candidate?.query ?? null,
      title: candidate?.title ?? '',
      displayLink: candidate?.displayLink ?? '',
      score: scoreByUrl.get(url) ?? null,
      url,
    };
  });
};

const evaluatePath = async (
    word: string,
    translation: string,
    queries: string[],
) => {
  const candidates = await collectImageSearchCandidates(queries, logger);
  if (candidates instanceof Error) {
    return {
      queries,
      error: candidates.message,
    };
  }

  const reranked = await reranker.rerank(word, translation, candidates, logger);
  const orderedUrls = orderImageCandidates(word, translation, candidates, reranked?.orderedUrls);

  return {
    queries,
    candidateCount: candidates.length,
    rerankerUsed: Boolean(reranked?.orderedUrls?.length),
    rerankerReasoning: reranked?.reasoning ?? null,
    top: summarizeCandidates(word, translation, candidates, orderedUrls),
  };
};

const main = async () => {
  const throttleMs = Number.parseInt(process.env.IMAGE_EVAL_DELAY_MS || '750', 10);
  const report: unknown[] = [];

  for (const testCase of cases as EvalCase[]) {
    const deterministicQueries = buildDeterministicImageSearchQueries(testCase.word, testCase.translation);
    const planned = await planner.plan(testCase.word, testCase.translation, logger);
    const selectedQueries = planned
      ? [
          ...new Set(
            planned.candidates.flatMap((candidate) => [
              candidate.scene ? `${candidate.subject} ${candidate.scene}` : `${candidate.subject} illustration`,
              candidate.styleHint ? `${candidate.subject} ${candidate.styleHint}` : '',
            ]).filter(Boolean),
          ),
        ].slice(0, 5)
      : deterministicQueries;

    const productionPath = await evaluatePath(testCase.word, testCase.translation, selectedQueries);
    if (throttleMs > 0) await delay(throttleMs);
    const deterministicBaseline = await evaluatePath(testCase.word, testCase.translation, deterministicQueries);

    report.push({
      word: testCase.word,
      translation: testCase.translation,
      kind: testCase.kind ?? null,
      plannerUsed: Boolean(planned?.candidates?.length),
      plannerIntent: planned?.intent ?? null,
      plannerConfidence: planned?.confidence ?? null,
      selectedQueries,
      deterministicQueries,
      productionPath,
      deterministicBaseline,
    });

    if (throttleMs > 0) await delay(throttleMs);
  }

  console.log(JSON.stringify(report, null, 2));
};

await main();
