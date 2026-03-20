import { useActionState } from "react";
import { saveWord } from "@/shared/api/words";
import type { EditWordFormData } from "../schema";

type State = {
	submitted: boolean;
};

type Payload = {
	data: EditWordFormData;
	initData: string;
	chatID: string;
	messageID?: string;
	onSubmit?: () => void;
};

const submitReducer = async (
	state: State,
	payload: Payload,
): Promise<State> => {
	if (state.submitted) {
		return state;
	}

	const { data, initData, chatID, messageID, onSubmit } = payload;

	try {
		await saveWord(
			initData,
			chatID,
			{
				_id: data.id,
				English: data.word,
				Translation: data.translation,
				Examples: data.example,
			},
			messageID,
		);
		onSubmit?.();
	} catch (error) {
		console.error("Failed to save word:", error);
		return {
			submitted: false,
		};
	}
	return {
		submitted: true,
	};
};

export const useEditWordSubmission = () => {
	const [state, dispatch, isLoading] = useActionState(submitReducer, {
		submitted: false,
	});

	return {
		isSubmitted: state.submitted,
		submit: dispatch,
		isLoading,
	};
};
