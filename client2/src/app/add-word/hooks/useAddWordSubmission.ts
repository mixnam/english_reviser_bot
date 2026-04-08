import { useActionState } from "react";
import { submitWord, uploadImage } from "@/shared/api/words";
import type { WordFormData } from "@/shared/ui/WordForm";

type State =
	| { status: "editing" }
	| { status: "submitted"; word: Awaited<ReturnType<typeof submitWord>> }
	| { status: "error"; error: string };

type Payload = {
	data: WordFormData;
	initData: string;
	chatID: string;
};

type Action = { type: "submit"; payload: Payload } | { type: "reset" };

const submitReducer = async (state: State, action: Action): Promise<State> => {
	if (action.type === "reset") {
		return { status: "editing" };
	}

	if (state.status === "submitted") {
		return state;
	}

	const { data, initData, chatID } = action.payload;

	try {
		const imageUrl = await (async () => {
			switch (data.selectedImage?.type) {
				case undefined:
					return null;
				case "local": {
					const uploadRes = await uploadImage(
						initData,
						chatID,
						data.selectedImage.file,
					);
					return uploadRes.url;
				}
				case "remote": {
					return data.selectedImage.url;
				}
			}
		})();

		const savedWord = await submitWord(initData, chatID, {
			word: data.word,
			translation: data.translation,
			example: data.example || null,
			imageUrl,
		});

		return {
			status: "submitted",
			word: savedWord,
		};
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to save word";
		console.error("Failed to submit word:", error);
		return {
			status: "error",
			error: message,
		};
	}
};

export const useAddWordSubmission = () => {
	const [state, dispatch, isLoading] = useActionState(submitReducer, {
		status: "editing",
	});

	return {
		state,
		submit: (payload: Payload) => dispatch({ type: "submit", payload }),
		reset: () => dispatch({ type: "reset" }),
		isLoading,
	};
};
