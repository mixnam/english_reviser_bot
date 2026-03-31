"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	Button,
	Caption,
	IconButton,
	List,
	Textarea,
	Title,
} from "@telegram-apps/telegram-ui";
import { startTransition, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useTelegram } from "@/app/telegram";
import { useDebounced } from "@/shared/hooks/useDebounced";
import { useExampleGenerator } from "@/shared/hooks/useExampleGenerator";
import { useImages } from "@/shared/hooks/useImages";
import { useSimilarWordsCheck } from "@/shared/hooks/useSimilarWordsCheck";
import { i18n } from "@/shared/lib/i18n";
import { ImagePreview } from "@/shared/ui/ImagePreview";
import { ReloadIcon } from "@/shared/ui/ReloadIcon";
import { useSearchParams } from "next/navigation";

export const WordFormDataSchema = z.object({
	word: z.string().min(1, i18n.wordRequired),
	translation: z.string().min(1, i18n.translationRequired),
	example: z.string().optional(),
	selectedImage: z
		.discriminatedUnion("type", [
			z.object({ type: z.literal("remote"), url: z.string() }),
			z.object({ type: z.literal("local"), file: z.any(), url: z.string() }),
		])
		.optional(),
});

export type WordFormData = z.infer<typeof WordFormDataSchema>;

type WordFormProps = {
	title: string;
	mode: "edit" | "add";
	defaultValues?: Partial<WordFormData>;
	onSubmit: (data: WordFormData) => void;
	onDelete?: () => void;
	disabled?: boolean;
};

export const WordForm = ({
	title,
	mode,
	defaultValues,
	onSubmit,
	onDelete,
	disabled: externalDisabled,
}: WordFormProps) => {
	const { webApp } = useTelegram();
	const initData = webApp?.initData || "";
	const searchParams = useSearchParams();
	const chatID = searchParams.get("chat_id") ?? "";

	const {
		register,
		setValue,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<WordFormData>({
		resolver: zodResolver(WordFormDataSchema),
		mode: "onSubmit",
		reValidateMode: "onChange",
		defaultValues: {
			word: "",
			translation: "",
			example: "",
			...defaultValues,
		},
	});

	const wordValue = watch("word");
	const translationValue = watch("translation");
	const selectedImageUrlValue = watch("selectedImage.url");

	const [previewIsOpen, setPreviewIsOpen] = useState(false);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const {
		example,
		generateExample,
		isLoading: isGenerating,
	} = useExampleGenerator();

	const {
		similarWords,
		checkWord,
		isLoading: isSimilarWordChecking,
	} = useSimilarWordsCheck();

	const {
		images,
		searchImage,
		addLocalImage,
		resetOffset,
		isLoading: isImagesLoading,
	} = useImages();

	const debouncedWord = useDebounced(wordValue, 1000);

	useEffect(() => {
		switch (mode) {
			case "edit":
				return;
			case "add":
				if (debouncedWord) {
					checkWord({
						initData,
						chatID,
						word: debouncedWord,
					});
					resetOffset();
				}
		}
	}, [checkWord, resetOffset, debouncedWord, mode, initData, chatID]);

	useEffect(() => {
		if (example) {
			setValue("example", example, { shouldValidate: true });
		}
	}, [example, setValue]);

	const onGenerateExample = () => {
		startTransition(() => {
			generateExample({
				word: wordValue,
				translation: translationValue,
				initData,
				chatID,
			});
		});
	};

	const onImageSearch = () => {
		searchImage({
			initData,
			chatID,
			word: wordValue,
			translation: translationValue,
		});
	};

	const onUploadClick = () => {
		fileInputRef.current?.click();
	};

	const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		addLocalImage(file);
		event.target.value = "";
	};

	const isFormDisabled =
		externalDisabled ||
		isGenerating ||
		isSimilarWordChecking ||
		isImagesLoading;

	return (
		<form className="w-full h-full flex flex-col p-4" onSubmit={handleSubmit(onSubmit)}>
			<Title className="text-center pb-5" level="1" weight="2">
				{title}
			</Title>

			<List>
				<input
					ref={fileInputRef}
					type="file"
					accept="image/*"
					className="hidden"
					onChange={onFileChange}
				/>
				<Textarea
					{...register("word")}
					header={i18n.word}
					disabled={isFormDisabled}
					status={errors.word ? "error" : undefined}
				/>
				{!!similarWords?.length && (
					<div className="flex items-center text-amber-500 justify-between px-5.5 pb-2 -mt-3 z-50">
						<Caption>{`${i18n.similarWords}${similarWords.join(", ")}`}</Caption>
					</div>
				)}
				<Textarea
					{...register("translation")}
					header={i18n.translation}
					disabled={isFormDisabled}
					status={errors.translation ? "error" : undefined}
				/>
				<div className="relative">
					<Textarea
						{...register("example")}
						header={i18n.examples}
						disabled={isFormDisabled}
						status={errors.example ? "error" : undefined}
					/>
					<div className="flex items-center justify-between px-5.5 pb-2">
						<Caption>{i18n.generateExample}</Caption>
						<IconButton
							size="s"
							mode="plain"
							type="button"
							onClick={onGenerateExample}
							disabled={isFormDisabled || !wordValue || !translationValue}
						>
							<ReloadIcon size={18} />
						</IconButton>
					</div>
				</div>

				<div className="flex items-center justify-between px-5.5">
					<Caption>{i18n.searchImage}</Caption>
					<div className="flex items-center gap-2">
						<Button
							size="s"
							mode="bezeled"
							type="button"
							onClick={onUploadClick}
							disabled={isFormDisabled}
						>
							{i18n.upload}
						</Button>
						<IconButton
							size="s"
							mode="plain"
							type="button"
							onClick={onImageSearch}
							disabled={isFormDisabled || !wordValue}
						>
							<ReloadIcon size={18} />
						</IconButton>
					</div>
				</div>

				{(images?.length > 0 ||
					(selectedImageUrlValue &&
						images.every((img) => img.url !== selectedImageUrlValue))) && (
					<div className="flex flex-wrap gap-2 px-5.5 pb-4">
						{/* If we have a selected image that is not in the search results (e.g. initial image), show it first */}
						{selectedImageUrlValue &&
							images.every((img) => img.url !== selectedImageUrlValue) && (
								<button
									type="button"
									className="shrink-0 cursor-pointer border-2 rounded-lg overflow-hidden border-[#007aff]"
									onClick={() => setPreviewIsOpen(true)}
								>
									<picture>
										<source srcSet={selectedImageUrlValue} />
										<img
											src={selectedImageUrlValue}
											alt="Current"
											className="h-24 w-24 object-cover"
										/>
									</picture>
								</button>
							)}
						{images.map((img) => (
							<button
								type="button"
								key={img.url}
								className={`shrink-0 cursor-pointer border-2 rounded-lg overflow-hidden ${selectedImageUrlValue === img.url ? "border-[#007aff]" : "border-transparent"}`}
								onClick={() => {
									setPreviewIsOpen(true);
									if (img.type === "remote") {
										setValue("selectedImage", {
											type: "remote",
											url: img.url,
										});
									} else {
										setValue("selectedImage", {
											type: "local",
											url: img.url,
											file: img.file,
										});
									}
								}}
							>
								<picture>
									<source srcSet={img.url} />
									<img
										src={img.url}
										alt={img.url}
										className="h-24 w-24 object-cover"
									/>
								</picture>
							</button>
						))}
					</div>
				)}

				{previewIsOpen && selectedImageUrlValue && (
					<ImagePreview
						url={selectedImageUrlValue}
						onClose={() => setPreviewIsOpen(false)}
					/>
				)}
			</List>

			<div className="flex flex-1 flex-col justify-end mt-4 gap-2">
				<Button
					className="max-h-12"
					type="submit"
					stretched
					loading={externalDisabled && !onDelete}
					disabled={isFormDisabled}
				>
					{i18n.save}
				</Button>
				{onDelete && (
					<Button
						className="max-h-12"
						mode="plain"
						color="red"
						type="button"
						stretched
						onClick={onDelete}
						disabled={isFormDisabled}
					>
						{i18n.deleteWord}
					</Button>
				)}
			</div>
		</form>
	);
};
