import { z } from "zod";

export const WordSchema = z.object({
  _id: z.string(),
  English: z.string(),
  Translation: z.string(),
  Examples: z.string().optional(),
  ImageURL: z.string().optional(),
  AudioURL: z.string().optional(),
  Progress: z.string(),
});

export type Word = z.infer<typeof WordSchema>;
