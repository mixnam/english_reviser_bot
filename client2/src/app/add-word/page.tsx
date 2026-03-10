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
import { useSearchParams } from "next/navigation";
import { Suspense, startTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTelegram } from "@/app/telegram";
import { useDebounced } from "@/shared/hooks/useDebounced";
import { i18n } from "@/shared/lib/i18n";
import { ReloadIcon } from "@/shared/ui/ReloadIcon";
import { useAddWordSubmission } from "./hooks/useAddWordSubmission";
import { useExampleGenerator } from "./hooks/useExampleGenerator";
import { useSearchImage } from "./hooks/useSearchImage";
import { useSimilarWordsCheck } from "./hooks/useSimilarWordsCheck";
import { type AddWordFormData, addWordSchema } from "./schema";

const AddWordForm = () => {
	const searchParams = useSearchParams();
	const chatID = searchParams.get("chat_id") ?? "";
	const { initData } = useTelegram();

	const {
		register,
		setValue,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<AddWordFormData>({
		resolver: zodResolver(addWordSchema),
		mode: "onSubmit",
		reValidateMode: "onChange",
		defaultValues: {
			word: "",
			translation: "",
			example: "",
		},
	});

	const wordValue = watch("word");
	const selectedImageUrlValue = watch("selectedImageUrl");

	const { submit, isLoading: isSubmitting } = useAddWordSubmission();

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
		resetOffset,
		isLoading: isImageSearching,
	} = useSearchImage();

	const debouncedWord = useDebounced(wordValue, 1000);

	useEffect(() => {
		checkWord({
			initData,
			chatID,
			word: debouncedWord,
		});
		resetOffset();
	}, [checkWord, resetOffset, debouncedWord, initData, chatID]);

	useEffect(() => {
		if (example) {
			setValue("example", example, { shouldValidate: true });
		}
	}, [example, setValue]);

	const onSubmit = (data: AddWordFormData) => {
		startTransition(() => {
			submit({
				data,
				initData,
				chatID,
			});
		});
	};

	const onGenerateExample = (data: AddWordFormData) => {
		startTransition(() => {
			generateExample({
				word: data.word,
				translation: data.translation,
				initData,
				chatID,
			});
		});
	};

	const onImageSearch = (data: AddWordFormData) => {
		searchImage({
			initData,
			chatID,
			word: data.word,
			translation: data.translation,
		});
	};

	const isFormDisabled =
		isSubmitting || isGenerating || isSimilarWordChecking || isImageSearching;

	return (
		<form
			className="w-full h-full flex flex-col p-4"
			onSubmit={handleSubmit(onSubmit)}
		>
			<Title className="text-center pb-5" level="1" weight="2">
				Add new word
			</Title>

			<List>
				<Textarea
					{...register("word")}
					header={i18n.word}
					disabled={isFormDisabled}
					status={errors.word ? "error" : undefined}
				/>
				{!!similarWords?.length && (
					<div className="flex items-center text-amber-500 justify-between px-[22px] pb-2 -mt-3 z-50">
						<Caption>{`You have some similar words: ${similarWords.join(", ")}`}</Caption>
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
						<Caption>Generate example</Caption>
						<IconButton
							size="s"
							mode="plain"
							type="button"
							onClick={handleSubmit(onGenerateExample)}
						>
							<ReloadIcon size={18} />
						</IconButton>
					</div>
				</div>

				<div className="flex items-center justify-between px-[22px]">
					<Caption>Search Image</Caption>
					<div className="flex items-center gap-2">
						<Button
							size="s"
							mode="bezeled"
							type="button"
							// onClick={() => fileInputRef.current?.click()}
							// disabled={submitWordMutation.isPending}
						>
							Upload
						</Button>
						<IconButton
							size="s"
							mode="plain"
							type="button"
							onClick={handleSubmit(onImageSearch)}
							disabled={isFormDisabled}
						>
							<ReloadIcon size={18} />
						</IconButton>
					</div>
				</div>

				{images?.length && (
					<div className="flex gap-2 overflow-x-auto px-[22px] pb-4">
						{images.map((url) => (
							<div
								key={url}
								className={`shrink-0 cursor-pointer border-2 rounded-lg overflow-hidden ${selectedImageUrlValue === url ? "border-[#007aff]" : "border-transparent"}`}
								onClick={() => setValue("selectedImageUrl", url)}
								// onTouchStart={() => onTouchStart(url)}
								// onTouchEnd={onTouchEnd}
								// onTouchMove={onTouchEnd}
							>
								<img
									src={url}
									alt="result"
									className="h-24 w-24 object-cover"
								/>
							</div>
						))}
					</div>
				)}

				{/* {filePreview && ( */}
				{/* 	<div className="flex gap-2 px-[22px] pb-4"> */}
				{/* 		<div */}
				{/* 			className="shrink-0 cursor-pointer border-2 rounded-lg overflow-hidden border-[#007aff]" */}
				{/* 			onTouchStart={() => onTouchStart(filePreview)} */}
				{/* 			onTouchEnd={onTouchEnd} */}
				{/* 			onTouchMove={onTouchEnd} */}
				{/* 		> */}
				{/* 			<img */}
				{/* 				src={filePreview} */}
				{/* 				alt="preview" */}
				{/* 				className="h-24 w-24 object-cover" */}
				{/* 			/> */}
				{/* 		</div> */}
				{/* 	</div> */}
				{/* )} */}
			</List>

			<div className="flex flex-1 flex-col justify-end mt-4">
				<Button
					className="max-h-12"
					type="submit"
					stretched
					loading={isSubmitting}
				>
					{i18n.save}
				</Button>
			</div>
		</form>
	);
};

const AddWordPage = () => (
	<Suspense
		fallback={<div className="p-4 text-center text-gray-500">Loading...</div>}
	>
		<AddWordForm />
	</Suspense>
);

export default AddWordPage;
