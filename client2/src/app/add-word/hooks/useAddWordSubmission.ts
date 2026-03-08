// import WebApp from "@twa-dev/sdk";
import { useActionState } from "react";
import { submitWord, uploadImage } from "@/shared/api/words";
import type { AddWordFormData } from "../schema";

type State = {
	submitted: boolean;
};

type Payload = {
	data: AddWordFormData;
	initData: string;
	chatID: string;
};

const submitReducer = async (
	state: State,
	payload: Payload,
): Promise<State> => {
	if (state.submitted) {
		return state;
	}

	const { data, initData, chatID } = payload;
	try {
		// todo upload image

		await submitWord(initData, chatID, {
			word: data.word,
			translation: data.translation,
			example: data.example || null,
			imageUrl: data.selectedImageUrl || null,
		});

		// WebApp.close();
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
