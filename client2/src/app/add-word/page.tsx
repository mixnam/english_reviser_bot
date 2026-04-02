"use client";

import { Button, Card, Text, Title } from "@telegram-apps/telegram-ui";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { i18n } from "@/shared/lib/i18n";
import { WordForm, type WordFormData } from "@/shared/ui/WordForm";

type MockAddedWord = {
	English: string;
	Translation: string;
	Examples?: string | null;
	ImageURL?: string;
};

const WordAddedCard = ({
	word,
	onAddNewWord,
	onClose,
}: {
	word: MockAddedWord;
	onAddNewWord: () => void;
	onClose: () => void;
}) => {
	return (
		<div className="w-full h-full flex flex-col p-4">
			<Title className="text-center pb-5" level="1" weight="2">
				{i18n.addNewWord}
			</Title>

			<div className="flex-1 min-h-0">
				<div className="rounded-2xl shadow-2xl shadow-blue-200 h-full min-h-0 flex flex-col">
					<Card className="w-full h-full overflow-hidden relative flex-1 min-h-0 p-0">
						<div className="flex flex-col w-full h-full">
							{word.ImageURL && (
								<div className="w-full bg-gray-50 relative overflow-hidden flex-1 min-h-[180px]">
									<Image
										src={word.ImageURL}
										alt={word.English}
										fill
										unoptimized
										className="object-contain p-2"
									/>
								</div>
							)}

							<div className="p-4 flex flex-col items-center gap-3 shrink-0 overflow-y-auto text-center">
								<Text
									weight="1"
									className="text-2xl whitespace-pre-wrap text-center"
								>
									{word.English}
								</Text>
								<Text
									weight="2"
									className="text-blue-500 whitespace-pre-wrap text-center"
								>
									{word.Translation}
								</Text>
								{word.Examples && (
									<Text className="text-gray-500 italic whitespace-pre-wrap text-center">
										“{word.Examples}”
									</Text>
								)}
							</div>
						</div>
					</Card>
				</div>
			</div>

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
};

const AddWordPageContent = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [mockAddedWord, setMockAddedWord] = useState<MockAddedWord | null>(
		null,
	);

	const chatID = searchParams.get("chat_id") ?? "";
	const closeHref = useMemo(
		() => (chatID ? `/?chat_id=${encodeURIComponent(chatID)}` : "/"),
		[chatID],
	);

	const onSubmit = (data: WordFormData) => {
		setMockAddedWord({
			English: data.word,
			Translation: data.translation,
			Examples: data.example || null,
			ImageURL: data.selectedImage?.url,
		});
	};

	const onAddNewWord = () => {
		setMockAddedWord(null);
	};

	const onClose = () => {
		router.push(closeHref);
	};

	if (mockAddedWord) {
		return (
			<WordAddedCard
				word={mockAddedWord}
				onAddNewWord={onAddNewWord}
				onClose={onClose}
			/>
		);
	}

	return <WordForm title={i18n.addNewWord} mode="add" onSubmit={onSubmit} />;
};

const AddWordPage = () => (
	<Suspense
		fallback={<div className="p-4 text-center text-gray-500">Loading...</div>}
	>
		<AddWordPageContent />
	</Suspense>
);

export default AddWordPage;
