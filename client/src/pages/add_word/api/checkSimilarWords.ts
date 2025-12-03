import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "../../../config";

import WebApp from "@twa-dev/sdk";

const CHECK_SIMILAR_WORD_KEY = "check_similar_word_key";

type Data = {
  words: string[];
} | null;

export const useCheckSimilarWorkQuery = ({
  word,
  chatID,
}: {
  word: string;
  chatID: string;
}) => {
  return useQuery<Data>({
    queryKey: [CHECK_SIMILAR_WORD_KEY, chatID, word],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/chat/${chatID}/word/similar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Telegram-Init-Data": WebApp.initData,
          },
          body: JSON.stringify({
            word,
          }),
        },
      ).then((response) => response.json());

      return response;
    },
    initialData: null,
    enabled: false,
  });
};
