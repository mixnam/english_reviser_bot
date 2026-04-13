import { startTransition, useActionState, useLayoutEffect } from "react";
import type { Word } from "@/shared/api/types";
import { getReviseWord, updateReviseProgress } from "@/shared/api/words";

type State =
	| { type: "init" }
	| {
			type: "no_words";
	  }
	| { type: "error"; message?: string }
	| {
			type: "word";
			word: Word;
			revealed: boolean;
	  }
	| {
			type: "editing";
			word: Word;
	  };

type Payload = (
	| {
			type: "init";
	  }
	| {
			type: "mark_word";
			wordID: string;
			remember: boolean;
	  }
	| {
			type: "reveal_word";
	  }
	| {
			type: "edit_word";
	  }
	| {
			type: "continue_revise";
			word: Word | null;
	  }
) & {
	initData: string;
	chatId: string;
};

const useReviseSessionReducer = async (
	state: State,
	payload: Payload,
): Promise<State> => {
	switch (payload.type) {
		case "init": {
			const nextWord = await getReviseWord(payload.initData, payload.chatId);
			if (nextWord) {
				return {
					...state,
					type: "word",
					word: nextWord,
					revealed: false,
				};
			}
			return { type: "no_words" };
		}
		case "reveal_word": {
			switch (state.type) {
				case "init":
				case "no_words":
				case "error":
				case "editing":
					return state;
				case "word":
					return { ...state, revealed: true };
			}
			return state;
		}
		case "mark_word": {
			await updateReviseProgress(
				payload.initData,
				payload.chatId,
				payload.wordID,
				payload.remember,
			);
			const nextWord = await getReviseWord(payload.initData, payload.chatId);
			if (nextWord) {
				return {
					...state,
					type: "word",
					word: nextWord,
					revealed: false,
				};
			}
			return { type: "no_words" };
		}
		case "edit_word": {
			switch (state.type) {
				case "init":
				case "no_words":
				case "error":
				case "editing":
					return state;
				case "word":
					return {
						type: "editing",
						word: state.word,
					};
			}
			return state;
		}
		case "continue_revise": {
            if (payload.word) {
                return {
					...state,
					type: "word",
					word: payload.word,
					revealed: false,
                }
            }
			const nextWord = await getReviseWord(payload.initData, payload.chatId);
			if (nextWord) {
				return {
					...state,
					type: "word",
					word: nextWord,
					revealed: false,
				};
			}
			return { type: "no_words" };
		}
	}
};

export const useReviseSession = (initData: string, chatID: string) => {
	const [state, dispatch, isLoading] = useActionState(useReviseSessionReducer, {
		type: "init",
	});

	useLayoutEffect(() => {
		startTransition(() => dispatch({ type: "init", initData, chatId: chatID }));
	}, [initData, chatID, dispatch]);

	return {
		state,
		isLoading,
		revealWord: () => {
			startTransition(() =>
				dispatch({
					type: "reveal_word",
					initData,
					chatId: chatID,
				}),
			);
		},
		editWord: () => {
			startTransition(() => {
				dispatch({ type: "edit_word", initData, chatId: chatID });
			});
		},
		continueRevise: (word: Word | null) => {
			startTransition(() => {
				dispatch({ type: "continue_revise", word, initData, chatId: chatID });
			});
		},
		submitDecision: (wordID: string, remember: boolean) =>
			startTransition(() =>
				dispatch({
					type: "mark_word",
					wordID,
					remember,
					initData,
					chatId: chatID,
				}),
			),
	};
};
