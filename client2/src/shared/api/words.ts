import { apiFetch } from "./client";
import type { Word } from "./types";

export const getReviseWord = (initData: string, chatID: string) => {
	return apiFetch<Word | null>(`/chat/${chatID}/word/random-revise`, initData);
};

export const updateReviseProgress = (
	initData: string,
	chatID: string,
	wordID: string,
	remember: boolean,
) => {
	return apiFetch<{ success: boolean }>(
		`/chat/${chatID}/word/${wordID}/progress`,
		initData,
		{
			method: "POST",
			body: JSON.stringify({ remember }),
		},
	);
};

export const getLearnWord = (initData: string, chatID: string) => {
	return apiFetch<Word | null>(`/chat/${chatID}/word/random-learn`, initData);
};

export const updateLearnProgress = (
	initData: string,
	chatID: string,
	wordID: string,
	remember: boolean,
) => {
	return apiFetch<{ success: boolean }>(
		`/chat/${chatID}/word/${wordID}/learn-progress`,
		initData,
		{
			method: "POST",
			body: JSON.stringify({ remember }),
		},
	);
};

export const saveWord = (
	initData: string,
	chatID: string,
	word: Partial<Word>,
) => {
	return apiFetch<Word>(`/chat/${chatID}/word/${word._id}`, initData, {
		method: "POST",
		body: JSON.stringify(word),
	});
};

export const submitWord = (
	initData: string,
	chatID: string,
	word: Partial<Word>,
) => {
	return apiFetch<Word>(`/chat/${chatID}/word`, initData, {
		method: "POST",
		body: JSON.stringify(word),
	});
};

export const checkSimilarWords = (
	initData: string,
	chatID: string,
	english: string,
) => {
	return apiFetch<Word[]>(`/chat/${chatID}/word/similar`, initData, {
		params: { english },
	});
};

export const getExamples = (initData: string, chatID: string, word: string) => {
	return apiFetch<{ examples: string }>(`/chat/${chatID}/examples`, initData, {
		params: { word },
	});
};

export const searchImages = (
	initData: string,
	chatID: string,
	query: string,
) => {
	return apiFetch<{ images: string[] }>(
		`/chat/${chatID}/search-images`,
		initData,
		{
			params: { query },
		},
	);
};

export const uploadImage = (
	initData: string,
	chatID: string,
	imageURL: string,
) => {
	return apiFetch<{ url: string }>(`/chat/${chatID}/upload-image`, initData, {
		method: "POST",
		body: JSON.stringify({ imageURL }),
	});
};
