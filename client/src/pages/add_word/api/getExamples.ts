import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "../../../config";

import WebApp from "@twa-dev/sdk";

const CHECK_SIMILAR_WORD_KEY = "get_examples";

export const useGetExamplesQuery = ({
  word,
  translation,
  chatID,
}: {
  word: string;
  translation: string;
  chatID: string;
}) => {
  return useQuery({
    initialData: { example: "" },
    queryKey: [CHECK_SIMILAR_WORD_KEY, chatID, word],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/chat/${chatID}/word/example`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Telegram-Init-Data": WebApp.initData,
          },
          body: JSON.stringify({
            word,
            translation,
          }),
        },
      ).then((response) => response.json());

      return response;
    },
    enabled: false,
  });
};
