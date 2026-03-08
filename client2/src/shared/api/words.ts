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

export const saveWord = (initData: string, chatID: string, word: Partial<Word>) => {
  return apiFetch<Word>(`/chat/${chatID}/word/${word._id}`, initData, {
    method: "POST",
    body: JSON.stringify(word),
  });
};

export const submitWord = (
  initData: string,
  chatID: string,
  word: {
    word: string;
    translation: string;
    example: string | null;
    imageUrl: string | null;
  },
) => {
  return apiFetch<{ success: boolean }>(`/chat/${chatID}/word/save`, initData, {
    method: "POST",
    body: JSON.stringify(word),
  });
};

export const checkSimilarWords = (initData: string, chatID: string, word: string) => {
  return apiFetch<{ words: string[] }>(`/chat/${chatID}/word/similar`, initData, {
    method: "POST",
    body: JSON.stringify({ word }),
  });
};

export const getExamples = (
  initData: string,
  chatID: string,
  word: string,
  translation: string,
) => {
  return apiFetch<{ example: string }>(`/chat/${chatID}/word/example`, initData, {
    method: "POST",
    body: JSON.stringify({ word, translation }),
  });
};

export const searchImages = (
  initData: string,
  chatID: string,
  word: string,
  translation: string,
  offset: number = 0,
) => {
  return apiFetch<{ urls: string[] }>(`/chat/${chatID}/word/image/search`, initData, {
    method: "POST",
    body: JSON.stringify({ word, translation, offset }),
  });
};

export const uploadImage = (initData: string, chatID: string, file: File | Blob) => {
  const formData = new FormData();
  formData.append("file", file as Blob);

  return apiFetch<{ url: string }>(`/chat/${chatID}/word/image/upload`, initData, {
    method: "POST",
    body: formData,
  });
};
