import { startTransition, useActionState, useCallback } from "react";

import { searchImages } from "@/shared/api/words";

type State = {
	offset: number;
	images: string[] | null;
};

type Payload =
	| {
			type: "reset_offset";
	  }
	| {
			type: "search";
			word: string;
			translation: string;
			initData: string;
			chatID: string;
	  };

const searchImageReducer = async (
	state: State,
	payload: Payload,
): Promise<State> => {
	switch (payload.type) {
		case "reset_offset":
			return { ...state, offset: 0 };
		case "search": {
			const { word, initData, chatID, translation } = payload;

			if (!word) return { images: null, offset: 0 };

			try {
				const res = await searchImages(
					initData,
					chatID,
					word,
					translation,
					state.offset,
				);
				return {
					images: res.urls,
					offset: state.offset + 5,
				};
			} catch (e) {
				console.error("AI Example generation failed:", e);
				return state;
			}
		}
	}
};

export const useSearchImage = () => {
	const [state, dispatch, isLoading] = useActionState(searchImageReducer, {
		images: null,
		offset: 0,
	});

	return {
		images: state.images,
		searchImage: useCallback(
			(payload: Omit<Extract<Payload, { type: "search" }>, "type">) => {
				payload;
				startTransition(() => {
					dispatch({
						type: "search",
						...payload,
					});
				});
			},
			[dispatch],
		),
		resetOffset: useCallback(() => {
			startTransition(() => {
				dispatch({ type: "reset_offset" });
			});
		}, [dispatch]),
		isLoading,
	};
};
