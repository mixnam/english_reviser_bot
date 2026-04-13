import { startTransition, useActionState, useLayoutEffect } from "react";
import type { LearnSummary, ProgressStats, Word } from "@/shared/api/types";
import {
	getLearnSummary,
	getLearnWord,
	updateLearnProgress,
} from "@/shared/api/words";

type State =
	| { type: "init" }
	| { type: "no_words"; before: ProgressStats | null }
	| { type: "error"; message?: string }
	| {
			type: "word";
			word: Word;
			revealed: boolean;
			sessionWordCount: number;
			before: ProgressStats | null;
	  }
	| {
			type: "completed";
			summary: LearnSummary;
			before: ProgressStats | null;
			sessionWordCount: number;
	  }
	| {
			type: "editing";
			word: Word;
			sessionWordCount: number;
			before: ProgressStats | null;
	  };

type Payload = (
	| { type: "init" }
	| { type: "mark_word"; wordID: string; remember: boolean }
	| { type: "reveal_word" }
	| { type: "edit_word" }
	| { type: "continue_learn"; word: Word | null }
) & {
	initData: string;
	chatId: string;
};

const useLearnSessionReducer = async (
	state: State,
	payload: Payload,
): Promise<State> => {
	switch (payload.type) {
		case "init": {
			const [nextWord, before] = await Promise.all([
				getLearnWord(payload.initData, payload.chatId),
				getLearnSummary(payload.initData, payload.chatId),
			]);
			if (nextWord) {
				return {
					type: "word",
					word: nextWord,
					revealed: false,
					sessionWordCount: 0,
					before: before?.stats || null,
				};
			}
			return { type: "no_words", before: before?.stats || null };
		}
		case "reveal_word": {
			switch (state.type) {
				case "init":
				case "no_words":
				case "error":
				case "completed":
				case "editing":
					return state;
				case "word":
					return { ...state, revealed: true };
			}
			return state;
		}
		case "mark_word": {
			await updateLearnProgress(
				payload.initData,
				payload.chatId,
				payload.wordID,
				payload.remember,
			);
			const nextWord = await getLearnWord(payload.initData, payload.chatId);
			if (nextWord && state.type === "word") {
				return {
					...state,
					type: "word",
					word: nextWord,
					revealed: false,
					sessionWordCount: state.sessionWordCount + 1,
				};
			}
			const summary = await getLearnSummary(payload.initData, payload.chatId);
			if (summary) {
				const sessionWordCount =
					state.type === "word" ? state.sessionWordCount + 1 : 0;
				return {
					type: "completed",
					summary,
					before: state.type === "word" ? state.before : null,
					sessionWordCount,
				};
			}
			return {
				type: "no_words",
				before: state.type === "word" ? state.before : null,
			};
		}
		case "edit_word": {
			switch (state.type) {
				case "init":
				case "no_words":
				case "error":
				case "completed":
				case "editing":
					return state;
				case "word":
					return {
						type: "editing",
						word: state.word,
						sessionWordCount: state.sessionWordCount,
						before: state.before,
					};
			}
			return state;
		}
		case "continue_learn": {
			switch (state.type) {
				case "init":
				case "no_words":
				case "error":
				case "word":
				case "completed":
					return state;
				case "editing": {
					if (payload.word) {
						return {
							type: "word",
							word: payload.word,
							revealed: false,
							sessionWordCount: state.sessionWordCount,
							before: state.before,
						};
					}
					const nextWord = await getLearnWord(payload.initData, payload.chatId);
					if (nextWord) {
						return {
							type: "word",
							word: nextWord,
							revealed: false,
							sessionWordCount: state.sessionWordCount,
							before: state.before,
						};
					}
					const summary = await getLearnSummary(
						payload.initData,
						payload.chatId,
					);
					if (summary) {
						return {
							type: "completed",
							summary,
							before: state.before,
							sessionWordCount: state.sessionWordCount,
						};
					}
					return {
						type: "no_words",
						before: state.before 
					};
				}
			}
		}
	}
};

export const useLearnSession = (initData: string, chatID: string) => {
	const [state, dispatch, isLoading] = useActionState(useLearnSessionReducer, {
		type: "init",
	});

	useLayoutEffect(() => {
		startTransition(() => dispatch({ type: "init", initData, chatId: chatID }));
	}, [initData, chatID, dispatch]);

	return {
		state,
		isLoading: isLoading,
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
		continueLearn: (word: Word | null) => {
			startTransition(() => {
				dispatch({ type: "continue_learn", word, initData, chatId: chatID });
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
