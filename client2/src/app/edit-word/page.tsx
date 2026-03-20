"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, startTransition } from "react";
import { useTelegram } from "@/app/telegram";
import { WordForm, type WordFormData } from "@/shared/ui/WordForm";
import { useEditWordSubmission } from "./hooks/useEditWordSubmission";

const EditWordPageContent = () => {
	const searchParams = useSearchParams();
	const chatID = searchParams.get("chat_id") ?? "";
	const messageID = searchParams.get("message_id") ?? "";
	const wordParam = searchParams.get("word");
	const { webApp } = useTelegram();
	const initData = webApp?.initData || "";

	const initialWord = wordParam
		? JSON.parse(decodeURIComponent(atob(wordParam)))
		: {};

	const { submit, remove, isLoading } = useEditWordSubmission();

	const onSubmit = (data: WordFormData) => {
		startTransition(() => {
			submit({
				id: initialWord._id,
				data,
				initData,
				chatID,
				messageID,
				onSuccess: () => webApp?.close(),
			});
		});
	};

	const onDelete = () => {
		webApp?.showConfirm("Are you sure you want to delete this word?", (confirmed) => {
			if (confirmed) {
				startTransition(() => {
					remove({
						id: initialWord._id,
						initData,
						chatID,
						onSuccess: () => webApp?.close(),
					});
				});
			}
		});
	};

	const defaultValues: Partial<WordFormData> = {
		word: initialWord.English || "",
		translation: initialWord.Translation || "",
		example: initialWord.Examples || "",
		selectedImage: initialWord.ImageURL ? {
			type: "remote",
			url: initialWord.ImageURL,
		} : undefined,
	};

	return (
		<WordForm
			title="Edit word"
			defaultValues={defaultValues}
			onSubmit={onSubmit}
			onDelete={onDelete}
			disabled={isLoading}
		/>
	);
};

const EditWordPage = () => (
	<Suspense
		fallback={<div className="p-4 text-center text-gray-500">Loading...</div>}
	>
		<EditWordPageContent />
	</Suspense>
);

export default EditWordPage;
