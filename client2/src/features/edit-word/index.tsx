"use client";

import { Suspense, startTransition } from "react";
import { useTelegram } from "@/app/telegram";
import { i18n } from "@/shared/lib/i18n";
import { WordForm, type WordFormData } from "@/shared/ui/WordForm";
import { useEditWordSubmission } from "./hooks/useEditWordSubmission";
import type { Word } from "@/shared/api/types";

type Props = {
	word: Word;
	chatID: string;
	onClose: () => void;
	onEditSuccess: (word: Word) => void;
	onWordDeleted: () => void;
};

const EditWordPageContent = ({
	word,
	chatID,
	onClose,
	onEditSuccess,
	onWordDeleted,
}: Props) => {
	const { webApp } = useTelegram();
	const initData = webApp?.initData || "";

	const initialWord = word;

	const { submit, remove, isLoading } = useEditWordSubmission();

	const onSubmit = (data: WordFormData) => {
		startTransition(() => {
			submit({
				id: initialWord._id,
				data,
				initData,
				chatID,
				onSuccess: onEditSuccess,
			});
		});
	};

	const onDelete = () => {
		webApp?.showConfirm(i18n.deleteConfirm, (confirmed) => {
			if (confirmed) {
				startTransition(() => {
					remove({
						id: initialWord._id,
						initData,
						chatID,
						onSuccess: onWordDeleted,
					});
				});
			}
		});
	};

	const defaultValues: Partial<WordFormData> = {
		word: initialWord.English || "",
		translation: initialWord.Translation || "",
		example: initialWord.Examples || "",
		selectedImage: initialWord.ImageURL
			? {
					type: "remote",
					url: initialWord.ImageURL,
				}
			: undefined,
	};

	return (
		<WordForm
			title={i18n.editWord}
			mode="edit"
			defaultValues={defaultValues}
			onSubmit={onSubmit}
			onDelete={onDelete}
			onBack={onClose}
			disabled={isLoading}
		/>
	);
};

const EditWord = (props: Props) => (
	<Suspense
		fallback={<div className="p-4 text-center text-gray-500">Loading...</div>}
	>
		<EditWordPageContent {...props} />
	</Suspense>
);

export default EditWord;
