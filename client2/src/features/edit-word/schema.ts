import { z } from "zod";

export const editWordSchema = z.object({
	id: z.string(),
	word: z.string().min(1, "Word is required"),
	translation: z.string().min(1, "Translation is required"),
	example: z.string().optional(),
});

export type EditWordFormData = z.infer<typeof editWordSchema>;
