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
	  };

type Payload = (
	| { type: "init" }
	| { type: "mark_word"; wordID: string; remember: boolean }
	| { type: "reveal_word" }
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
		word: state.type === "word" ? state.word : null,
		revealed: (() => {
			switch (state.type) {
				case "no_words":
				case "error":
				case "completed":
					return false;
				case "word":
					return state.revealed;
				default:
					return false;
			}
		})(),
		isError: state.type === "error",
		isLoading: isLoading || state.type === "init",
		sessionWordCount:
			state.type === "word" || state.type === "completed"
				? state.sessionWordCount
				: 0,
		completionSummary: state.type === "completed" ? state.summary : null,
		beforeStats:
			state.type === "completed"
				? state.before
				: state.type === "word" || state.type === "no_words"
					? state.before
					: null,
		revealWord: () => {
			startTransition(() =>
				dispatch({
					type: "reveal_word",
					initData,
					chatId: chatID,
				}),
			);
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
