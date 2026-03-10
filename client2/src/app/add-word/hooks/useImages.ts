import { startTransition, useActionState, useCallback } from "react";
import { searchImages } from "@/shared/api/words";

export type ImageItem =
	| {
			type: "remote";
			url: string;
	  }
	| {
			type: "local";
			url: string;
			file: File | Blob;
	  };

type State = {
	images: ImageItem[];
	offset: number;
};

type Payload =
	| { type: "reset_offset" }
	| {
			type: "search";
			word: string;
			translation: string;
			initData: string;
			chatID: string;
	  }
	| { type: "add_local"; file: File | Blob };

const imagesReducer = async (
	state: State,
	payload: Payload,
): Promise<State> => {
	switch (payload.type) {
		case "reset_offset":
			return {
				...state,
				offset: 0,
				images: state.images.filter((img) => img.type === "local"),
			};
		case "search": {
			const { word, initData, chatID, translation } = payload;
			if (!word)
				return {
					...state,
					images: state.images.filter((img) => img.type === "local"),
					offset: 0,
				};

			try {
				const res = await searchImages(
					initData,
					chatID,
					word,
					translation,
					state.offset,
				);
				const newImages = res.urls.map((url) => ({
					type: "remote" as const,
					url,
				}));

				const localImages = state.images.filter((img) => img.type === "local");
				const remoteImages =
					state.offset === 0
						? []
						: state.images.filter((img) => img.type === "remote");

				return {
					images: [...localImages, ...remoteImages, ...newImages],
					offset: state.offset + 5,
				};
			} catch (e) {
				console.error("Image search failed:", e);
				return state;
			}
		}
		case "add_local": {
			const { file } = payload;
			const url = await new Promise<string>((resolve) => {
				const reader = new FileReader();
				reader.onloadend = () => resolve(reader.result as string);
				reader.readAsDataURL(file);
			});
			return {
				...state,
				images: [{ type: "local", url, file }, ...state.images],
			};
		}
	}
};

export const useImages = () => {
	const [state, dispatch, isLoading] = useActionState(imagesReducer, {
		images: [],
		offset: 0,
	});

	const searchImage = useCallback(
		(payload: Omit<Extract<Payload, { type: "search" }>, "type">) => {
			startTransition(() => {
				dispatch({ type: "search", ...payload });
			});
		},
		[dispatch],
	);

	const addLocalImage = useCallback(
		(file: File | Blob) => {
			startTransition(() => {
				dispatch({ type: "add_local", file });
			});
		},
		[dispatch],
	);

	const resetOffset = useCallback(() => {
		startTransition(() => {
			dispatch({ type: "reset_offset" });
		});
	}, [dispatch]);

	return {
		images: state.images,
		searchImage,
		addLocalImage,
		resetOffset,
		isLoading,
	};
};
