"use client";

import { Button } from "@telegram-apps/telegram-ui";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useTelegram } from "@/app/telegram";
import type { Word } from "@/shared/api/types";
import { i18n } from "@/shared/lib/i18n";
import { WordCard } from "@/shared/ui/WordCard";
import { WordForm, type WordFormData } from "@/shared/ui/WordForm";
import { useAddWordSubmission } from "./hooks/useAddWordSubmission";

const AddWordPageContent = () => {
	const searchParams = useSearchParams();
	const chatID = searchParams.get("chat_id") ?? "";
	const { webApp } = useTelegram();
	const initData = webApp?.initData || "";
	const [savedWord, setSavedWord] = useState<Word | null>(null);

	const { submit, isLoading: isSubmitting } = useAddWordSubmission();

	const onSubmit = (data: WordFormData) => {
		submit({
			data,
			initData,
			chatID,
			onSubmit: setSavedWord,
		});
	};

	const onAddNewWord = () => {
		setSavedWord(null);
	};

	const onClose = () => {
		webApp?.close();
	};

	if (savedWord) {
		return (
			<div className="w-full h-full flex flex-col p-4">
				<WordCard word={savedWord} revealed={true} onReveal={() => undefined} />
				<div className="flex flex-col justify-end mt-4 gap-2">
					<Button
						className="max-h-12"
						type="button"
						stretched
						onClick={onAddNewWord}
					>
						{i18n.addNewWord}
					</Button>
					<Button
						className="max-h-12"
						mode="plain"
						type="button"
						stretched
						onClick={onClose}
					>
						{i18n.close}
					</Button>
				</div>
			</div>
		);
	}

	return (
		<WordForm
			title={i18n.addNewWord}
			mode="add"
			onSubmit={onSubmit}
			disabled={isSubmitting}
		/>
	);
};

const AddWordPage = () => (
	<Suspense
		fallback={<div className="p-4 text-center text-gray-500">Loading...</div>}
	>
		<AddWordPageContent />
	</Suspense>
);

export default AddWordPage;
