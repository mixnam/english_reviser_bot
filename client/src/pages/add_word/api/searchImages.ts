import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "../../../config";

import WebApp from "@twa-dev/sdk";

const SEARCH_IMAGES_KEY = "search_images";

export type Params = {
  word: string;
  translation: string;
  chatID: string;
  offset?: number;
  enabled: boolean;
};

type Data = {
  urls: string[];
};

export const useSearchImagesQuery = ({
  word,
  translation,
  chatID,
  offset = 0,
  enabled,
}: Params) => {
  return useQuery<null | Data>({
    initialData: null,
    queryKey: [SEARCH_IMAGES_KEY, chatID, word, offset],
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
            offset,
          }),
        },
      ).then((response) => response.json());

      return response as { urls: string[] };
    },
    enabled,
  });
};
