import { useMutation } from "@tanstack/react-query";
import { API_BASE_URL } from "../../../config";
import WebApp from "@twa-dev/sdk";

export const useUpdateWordProgressMutation = () => {
  return useMutation({
    mutationFn: async ({
      chatID,
      wordID,
      remember,
    }: {
      chatID: string;
      wordID: string;
      remember: boolean;
    }) => {
      const response = await fetch(
        `${API_BASE_URL}/chat/${chatID}/word/${wordID}/progress`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Telegram-Init-Data": WebApp.initData,
          },
          body: JSON.stringify({ remember }),
        },
      );
      if (!response.ok) {
        throw new Error("Failed to update progress");
      }
      return response.json();
    },
  });
};
