import { useActionState } from "react";

import { getExamples } from "@/shared/api/words";

type State = {
	example: string | null;
};

type Payload = {
	word: string;
	translation: string;
	initData: string;
	chatID: string;
};

const generateExampleReducer = async (
	state: State,
	payload: Payload,
): Promise<State> => {
	const { word, translation, initData, chatID } = payload;

	try {
		const res = await getExamples(initData, chatID, word, translation);
		return {
			example: res?.example || null,
		};
	} catch (e) {
		console.error("AI Example generation failed:", e);
		return state;
	}
};

export const useExampleGenerator = () => {
	const [state, dispatch, isLoading] = useActionState(generateExampleReducer, {
		example: null,
	});

	return {
		example: state.example,
		generateExample: dispatch,
		isLoading,
	};
};
