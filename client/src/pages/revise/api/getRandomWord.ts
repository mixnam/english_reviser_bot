import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "../../../config";
import WebApp from "@twa-dev/sdk";

export type Word = {
  _id: string;
  English: string;
  Translation: string;
  Progress: string;
  Examples?: string;
  ImageURL?: string;
  AudioURL?: string;
};

export const useGetRandomWordQuery = (chatID: string) => {
  return useQuery<Word | null>({
    queryKey: ["random-revise-word", chatID],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/chat/${chatID}/word/random-revise`,
        {
          headers: {
            "Telegram-Init-Data": WebApp.initData,
          },
        },
      );
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    },
    refetchOnWindowFocus: false,
  });
};
