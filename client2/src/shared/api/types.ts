import { z } from "zod";

export const WordSchema = z.object({
	_id: z.string(),
	English: z.string(),
	Translation: z.string(),
	Examples: z.nullable(z.string()).optional(),
	ImageURL: z.string().optional(),
	AudioURL: z.string().optional(),
	Progress: z.string(),
});

export type Word = z.infer<typeof WordSchema>;

export const ProgressBucketSchema = z.enum([
	"Have problems",
	"Have to pay attention",
	"Need to repeat",
	"Active learning",
	"Learned",
]);

export type ProgressBucket = z.infer<typeof ProgressBucketSchema>;

export const ProgressStatsSchema = z.record(ProgressBucketSchema, z.number());

export type ProgressStats = z.infer<typeof ProgressStatsSchema>;

export const LearnSummarySchema = z.object({
	stats: ProgressStatsSchema,
});

export type LearnSummary = z.infer<typeof LearnSummarySchema>;
