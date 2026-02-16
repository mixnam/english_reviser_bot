import { API_BASE_URL } from "../../../config";
import WebApp from "@twa-dev/sdk";

export const uploadImage = async (
  chatID: string,
  file: File,
): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}/chat/${chatID}/word/image/upload`,
    {
      method: "POST",
      headers: {
        "Telegram-Init-Data": WebApp.initData,
      },
      body: formData,
    },
  );

  if (!response.ok) {
    throw new Error("Failed to upload image");
  }

  return response.json();
};
