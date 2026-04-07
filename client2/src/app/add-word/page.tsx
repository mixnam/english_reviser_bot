"use client";

import { Button } from "@telegram-apps/telegram-ui";
import { useSearchParams } from "next/navigation";
import { Suspense, startTransition } from "react";
import { useTelegram } from "@/app/telegram";
import { i18n } from "@/shared/lib/i18n";
import { WordCard } from "@/shared/ui/WordCard";
import { WordForm, type WordFormData } from "@/shared/ui/WordForm";
import { useAddWordSubmission } from "./hooks/useAddWordSubmission";

const AddWordPageContent = () => {
	const searchParams = useSearchParams();
	const chatID = searchParams.get("chat_id") ?? "";
	const { webApp } = useTelegram();
	const initData = webApp?.initData || "";

	const {
		state,
		submit,
		reset,
		isLoading: isSubmitting,
	} = useAddWordSubmission();

	const onSubmit = (data: WordFormData) => {
		startTransition(() => {
			submit({
				data,
				initData,
				chatID,
			});
		});
	};

	const onAddNewWord = () => {
		reset();
	};

	const onClose = () => {
		webApp?.close();
	};

	const submitError = state.status === "error" ? state.error : undefined;

	if (state.status === "submitted" && state.word) {
		return (
			<div className="w-full h-full flex flex-col p-4">
				<WordCard
					word={state.word}
					revealed={true}
					onReveal={() => undefined}
				/>
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
			submitError={submitError}
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
