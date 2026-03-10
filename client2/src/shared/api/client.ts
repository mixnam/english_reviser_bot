import { API_BASE_URL } from "./config";

export type RequestOptions = RequestInit & {
	params?: Record<string, string>;
};

export const apiFetch = async (
	endpoint: string,
	initData: string,
	options: RequestOptions = {},
): Promise<Response | null> => {
	const { params, headers, body, ...rest } = options;

	let url = `${API_BASE_URL}${endpoint}`;
	if (params) {
		const searchParams = new URLSearchParams(params);
		const queryString = searchParams.toString();
		if (queryString) {
			url += `?${queryString}`;
		}
	}

	const isFormData = body instanceof FormData;

	const response = await fetch(url, {
		...rest,
		body,
		headers: {
			...(isFormData ? {} : { "Content-Type": "application/json" }),
			"Telegram-Init-Data": initData,
			...headers,
		},
	});

	if (response.status === 404) {
		return null;
	}

	if (!response.ok) {
		const error = await response
			.json()
			.catch(() => ({ message: "Network error" }));
		throw new Error(error.message || "Network response was not ok");
	}

	return response;
};
