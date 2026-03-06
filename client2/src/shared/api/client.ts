import { API_BASE_URL } from "./config";

export interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

export async function apiFetch<T>(
  endpoint: string,
  initData: string,
  options: RequestOptions = {},
): Promise<T> {
  const { params, headers, ...rest } = options;

  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const response = await fetch(url, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      "Telegram-Init-Data": initData,
      ...headers,
    },
  });

  if (response.status === 404) {
    return null as T;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Network error" }));
    throw new Error(error.message || "Network response was not ok");
  }

  return response.json();
}
