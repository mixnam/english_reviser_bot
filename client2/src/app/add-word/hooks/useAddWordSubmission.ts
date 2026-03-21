import { useActionState } from "react";
import { submitWord, uploadImage } from "@/shared/api/words";
import type { WordFormData } from "@/shared/ui/WordForm";

type State = {
	submitted: boolean;
};

type Payload = {
	data: WordFormData;
	initData: string;
	chatID: string;
	onSubmit?: () => void;
};

const submitReducer = async (
	state: State,
	payload: Payload,
): Promise<State> => {
	if (state.submitted) {
		return state;
	}

	const { data, initData, chatID, onSubmit } = payload;

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

		await submitWord(initData, chatID, {
			word: data.word,
			translation: data.translation,
			example: data.example || null,
			imageUrl,
		});

		onSubmit?.();
	} catch (error) {
		console.error("Failed to submit word:", error);
		return {
			submitted: false,
		};
	}
	return {
		submitted: true,
	};
};

export const useAddWordSubmission = () => {
	const [state, dispatch, isLoading] = useActionState(submitReducer, {
		submitted: false,
	});

	return {
		isSubmitted: state.submitted,
		submit: dispatch,
		isLoading,
	};
};
