import { z } from "zod";

export const addWordSchema = z.object({
	word: z.string().min(1, "Word is required"),
	translation: z.string().min(1, "Translation is required"),
	example: z.string().optional(),
	selectedImageUrl: z.string().optional(),
});

export type AddWordFormData = z.infer<typeof addWordSchema>;
