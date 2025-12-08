import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "../../../config";

import WebApp from "@twa-dev/sdk";

const SEARCH_IMAGES_KEY = "search_images";

type Data = {
  urls: string[];
};

export const useSearchImagesQuery = ({
  word,
  translation,
  chatID,
}: {
  word: string;
  translation: string;
  chatID: string;
}) => {
  return useQuery<null | Data>({
    initialData: null,
    queryKey: [SEARCH_IMAGES_KEY, chatID, word],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/chat/${chatID}/word/image/search`,
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

      return response as { urls: string[] };
    },
    enabled: false,
  });
};
