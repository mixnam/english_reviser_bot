import { startTransition, useActionState, useCallback } from "react";

import { checkSimilarWords } from "@/shared/api/words";

type State = {
	similarWords: string[] | null;
};

type Payload = {
	word: string;
	initData: string;
	chatID: string;
};

const checkSimilarWordsReducer = async (
	state: State,
	payload: Payload,
): Promise<State> => {
	const { word, initData, chatID } = payload;

	try {
		const res = await checkSimilarWords(initData, chatID, word);
		return {
			similarWords: res?.words?.length ? res.words : null,
		};
	} catch (e) {
		console.error("AI Example generation failed:", e);
		return state;
	}
};

export const useSimilarWordsCheck = () => {
	const [state, dispatch, isLoading] = useActionState(
		checkSimilarWordsReducer,
		{
			similarWords: null,
		},
	);

	return {
		similarWords: state.similarWords,
		checkWord: useCallback(
			(...args: Parameters<typeof dispatch>) => {
				startTransition(() => {
					dispatch(...args);
				});
			},
			[dispatch],
		),
		isLoading,
	};
};
