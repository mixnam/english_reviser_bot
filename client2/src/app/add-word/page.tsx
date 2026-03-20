"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, startTransition } from "react";
import { useTelegram } from "@/app/telegram";
import { WordForm, type WordFormData } from "@/shared/ui/WordForm";
import { useAddWordSubmission } from "./hooks/useAddWordSubmission";

const AddWordPageContent = () => {
	const searchParams = useSearchParams();
	const chatID = searchParams.get("chat_id") ?? "";
	const { webApp } = useTelegram();
	const initData = webApp?.initData || "";

	const { submit, isLoading: isSubmitting } = useAddWordSubmission();

	const onSubmit = (data: WordFormData) => {
		startTransition(() => {
			submit({
				data,
				initData,
				chatID,
				onSubmit: () => webApp?.close(),
			});
		});
	};

	return (
		<WordForm
			title="Add new word"
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
