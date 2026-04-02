import { useActionState } from "react";
import { submitWord, uploadImage } from "@/shared/api/words";
import type { WordFormData } from "@/shared/ui/WordForm";

type State = {
	submitted: boolean;
	error: string | null;
};

type Payload = {
	data: WordFormData;
	initData: string;
	chatID: string;
	onSubmit?: (word: Awaited<ReturnType<typeof submitWord>>) => void;
	onError?: (message: string) => void;
};

const submitReducer = async (
	state: State,
	payload: Payload,
): Promise<State> => {
	if (state.submitted) {
		return state;
	}

	const { data, initData, chatID, onSubmit, onError } = payload;

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

		onSubmit?.(savedWord);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to save word";
		console.error("Failed to submit word:", error);
		onError?.(message);
		return {
			submitted: false,
			error: message,
		};
	}
	return {
		submitted: true,
		error: null,
	};
};

export const useAddWordSubmission = () => {
	const [state, dispatch, isLoading] = useActionState(submitReducer, {
		submitted: false,
		error: null,
	});

	return {
		isSubmitted: state.submitted,
		error: state.error,
		submit: dispatch,
		isLoading,
	};
};
