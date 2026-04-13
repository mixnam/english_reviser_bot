import { useActionState, useCallback } from "react";
import { deleteWord, saveWord, uploadImage } from "@/shared/api/words";
import type { WordFormData } from "@/shared/ui/WordForm";
import { Word } from "@/shared/api/types";

type State = {
	submitted: boolean;
	deleted: boolean;
};

type SubmitPayload = {
	type: "submit";
	id: string;
	data: WordFormData;
	initData: string;
	chatID: string;
	onSuccess?: (word: Word) => void;
};

type DeletePayload = {
	type: "delete";
	id: string;
	initData: string;
	chatID: string;
	onSuccess?: () => void;
};

type Payload = SubmitPayload | DeletePayload;

const editWordReducer = async (
	state: State,
	payload: Payload,
): Promise<State> => {
	if (state.submitted || state.deleted) {
		return state;
	}

	try {
		if (payload.type === "submit") {
			const { data, initData, chatID, id, onSuccess } = payload;

			const imageUrl = await (async () => {
				switch (data.selectedImage?.type) {
					case undefined:
						return undefined; // Keep existing if not changed, or maybe we need a way to clear it?
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

			const updatedWord = await saveWord(initData, chatID, {
				_id: id,
				English: data.word,
				Translation: data.translation,
				Examples: data.example,
				ImageURL: imageUrl,
			});
			if (updatedWord) onSuccess?.(updatedWord);
			return { ...state, submitted: true };
		} else {
			const { id, initData, chatID, onSuccess } = payload;
			await deleteWord(initData, chatID, id);
			onSuccess?.();
			return { ...state, deleted: true };
		}
	} catch (error) {
		console.error(`Failed to ${payload.type} word:`, error);
		return state;
	}
};

export const useEditWordSubmission = () => {
	const [state, dispatch, isLoading] = useActionState(editWordReducer, {
		submitted: false,
		deleted: false,
	});

	const submit = useCallback(
		(payload: Omit<SubmitPayload, "type">) => {
			dispatch({ type: "submit", ...payload });
		},
		[dispatch],
	);

	const remove = useCallback(
		(payload: Omit<DeletePayload, "type">) => {
			dispatch({ type: "delete", ...payload });
		},
		[dispatch],
	);

	return {
		isSubmitted: state.submitted,
		isDeleted: state.deleted,
		submit,
		remove,
		isLoading,
	};
};
