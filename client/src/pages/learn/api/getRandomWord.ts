import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "../../../config";
import WebApp from "@twa-dev/sdk";
import { Word } from "../../revise/api/getRandomWord";

export const useGetRandomLearnWordQuery = (chatID: string) => {
  return useQuery<Word | null>({
    queryKey: ["random-learn-word", chatID],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/chat/${chatID}/word/random-learn`,
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
