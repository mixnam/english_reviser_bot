import { startTransition, useActionState, useCallback } from "react";

type State = {
	file: File | Blob | null;
	preview: string | null;
};

type Payload = {
	type: "select";
	file: File | Blob | null;
};

const localImageReducer = async (
	_state: State,
	payload: Payload,
): Promise<State> => {
	switch (payload.type) {
		case "select": {
			const { file } = payload;

			if (!file)
				return {
					file: null,
					preview: null,
				};

			const preview = await new Promise<string>((resolve) => {
				const reader = new FileReader();
				reader.onloadend = () => {
					resolve(reader.result as string);
				};
				reader.readAsDataURL(file);
			});

			return {
				file,
				preview,
			};
		}
	}
};

export const useLocalImage = () => {
	const [state, dispatch, isLoading] = useActionState(localImageReducer, {
		file: null,
		preview: null,
	});

	return {
		preview: state.preview,
		handleLocalFile: useCallback(
			(file: File | Blob | null) => {
				startTransition(() => {
					dispatch({
						type: "select",
						file,
					});
				});
			},
			[dispatch],
		),
		isLoading,
	};
};
