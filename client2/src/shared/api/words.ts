import { z } from "zod";
import { apiFetch } from "./client";
import {
	type LearnSummary,
	LearnSummarySchema,
	type Word,
	WordSchema,
} from "./types";

const SuccessResponseSchema = z.object({ success: z.boolean() });
const SimilarWordsResponseSchema = z.object({ words: z.array(z.string()) });
const ExampleResponseSchema = z.object({ example: z.string() });
const SearchImagesResponseSchema = z.object({ urls: z.array(z.string()) });
const UploadImageResponseSchema = z.object({ url: z.string() });

export const getReviseWord = async (initData: string, chatID: string) => {
	const response = await apiFetch(
		`/chat/${chatID}/word/random-revise`,
		initData,
	);
	if (!response) return null;
	const json = await response.json();
	return WordSchema.nullable().parse(json);
};

export const updateReviseProgress = async (
	initData: string,
	chatID: string,
	wordID: string,
	remember: boolean,
) => {
	const response = await apiFetch(
		`/chat/${chatID}/word/${wordID}/progress`,
		initData,
		{
			method: "POST",
			body: JSON.stringify({ remember }),
		},
	);
	if (!response) return null;
	const json = await response.json();
	return SuccessResponseSchema.parse(json);
};

export const getLearnWord = async (initData: string, chatID: string) => {
	const response = await apiFetch(
		`/chat/${chatID}/word/random-learn`,
		initData,
	);
	if (!response) return null;
	const json = await response.json();
	return WordSchema.nullable().parse(json);
};

export const getLearnSummary = async (
	initData: string,
	chatID: string,
): Promise<LearnSummary | null> => {
	const response = await apiFetch(
		`/chat/${chatID}/word/learn-summary`,
		initData,
	);
	if (!response) return null;
	const json = await response.json();
	return LearnSummarySchema.parse(json);
};

export const updateLearnProgress = async (
	initData: string,
	chatID: string,
	wordID: string,
	remember: boolean,
) => {
	const response = await apiFetch(
		`/chat/${chatID}/word/${wordID}/learn-progress`,
		initData,
		{
			method: "POST",
			body: JSON.stringify({ remember }),
		},
	);
	if (!response) return null;
	const json = await response.json();
	return SuccessResponseSchema.parse(json);
};

export const saveWord = async (
	initData: string,
	chatID: string,
	word: Partial<Word>,
	messageID?: string,
) => {
	const response = await apiFetch(
		`/chat/${chatID}/word/${word._id}`,
		initData,
		{
			method: "POST",
			body: JSON.stringify(word),
			headers: messageID ? { "Telegram-Message-ID": messageID } : undefined,
		},
	);
	if (!response) return null;
	const json = await response.json();
	return WordSchema.parse(json);
};

export const submitWord = async (
	initData: string,
	chatID: string,
	word: {
		word: string;
		translation: string;
		example: string | null;
		imageUrl: string | null;
	},
): Promise<Word> => {
	const response = await apiFetch(`/chat/${chatID}/word/save`, initData, {
		method: "POST",
		body: JSON.stringify(word),
	});
	if (!response) {
		throw new Error("No word returned after save");
	}
	const json = await response.json();
	return WordSchema.parse(json);
};

export const deleteWord = async (
	initData: string,
	chatID: string,
	wordID: string,
) => {
	await apiFetch(`/chat/${chatID}/word/${wordID}`, initData, {
		method: "DELETE",
	});
};

export const checkSimilarWords = async (
	initData: string,
	chatID: string,
	word: string,
) => {
	const response = await apiFetch(`/chat/${chatID}/word/similar`, initData, {
		method: "POST",
		body: JSON.stringify({ word }),
	});
	if (!response) return null;
	const json = await response.json();
	return SimilarWordsResponseSchema.parse(json);
};

export const getExamples = async (
	initData: string,
	chatID: string,
	word: string,
	translation: string,
) => {
	const response = await apiFetch(`/chat/${chatID}/word/example`, initData, {
		method: "POST",
		body: JSON.stringify({ word, translation }),
	});
	if (!response) return null;
	const json = await response.json();
	return ExampleResponseSchema.parse(json);
};

export const searchImages = async (
	initData: string,
	chatID: string,
	word: string,
	translation: string,
	offset = 0,
) => {
	const response = await apiFetch(
		`/chat/${chatID}/word/image/search`,
		initData,
		{
			method: "POST",
			body: JSON.stringify({ word, translation, offset }),
		},
	);
	if (!response) throw new Error();
	const json = await response.json();
	return SearchImagesResponseSchema.parse(json);
};

export const uploadImage = async (
	initData: string,
	chatID: string,
	file: File | Blob,
) => {
	const formData = new FormData();
	formData.append("file", file as Blob);

	const response = await apiFetch(
		`/chat/${chatID}/word/image/upload`,
		initData,
		{
			method: "POST",
			body: formData,
		},
	);
	if (!response) throw new Error();
	const json = await response.json();
	return UploadImageResponseSchema.parse(json);
};
