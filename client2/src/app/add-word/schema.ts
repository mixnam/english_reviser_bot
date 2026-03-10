import { z } from "zod";

export const addWordSchema = z.object({
	word: z.string().min(1, "Word is required"),
	translation: z.string().min(1, "Translation is required"),
	example: z.string().optional(),
	selectedImage: z.discriminatedUnion("type", [
		z.object({ type: z.literal("remote"), url: z.string() }),
		z.object({ type: z.literal("local"), file: z.file() }),
	]).optional(),
});

export type AddWordFormData = z.infer<typeof addWordSchema>;
