import { useMutation } from "@tanstack/react-query";
import { API_BASE_URL } from "../../../config";

import WebApp from "@twa-dev/sdk";

export const useSubmitWordMutation = () => {
  return useMutation({
    mutationFn: ({
      chatID,
      word,
      translation,
      example,
      imageUrl,
    }: {
      chatID: string;
      word: string;
      translation: string;
      example: string | null;
      imageUrl: string | null;
    }) => {
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
          imageUrl,
        }),
      });
    },
  });
};
