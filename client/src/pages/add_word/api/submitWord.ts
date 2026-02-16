import { useMutation } from "@tanstack/react-query";
import { API_BASE_URL } from "../../../config";
import { uploadImage } from "./uploadImage";

import WebApp from "@twa-dev/sdk";

export const useSubmitWordMutation = () => {
  return useMutation({
    mutationFn: async ({
      chatID,
      word,
      translation,
      example,
      imageUrl,
      file,
    }: {
      chatID: string;
      word: string;
      translation: string;
      example: string | null;
      imageUrl: string | null;
      file?: File | Blob;
    }) => {
      let finalImageUrl = imageUrl;

      if (file) {
        const { url } = await uploadImage(chatID, file as File);
        finalImageUrl = url;
      }

      return fetch(`${API_BASE_URL}/chat/${chatID}/word/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Telegram-Init-Data": WebApp.initData,
        },
        body: JSON.stringify({
          word,
          translation,
          example,
          imageUrl: finalImageUrl,
        }),
      });
    },
  });
};
