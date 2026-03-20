"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, List, Textarea, Title } from "@telegram-apps/telegram-ui";
import { useSearchParams } from "next/navigation";
import { Suspense, startTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTelegram } from "@/app/telegram";
import { i18n } from "@/shared/lib/i18n";
import { useEditWordSubmission } from "./hooks/useEditWordSubmission";
import { type EditWordFormData, editWordSchema } from "./schema";

const EditWordForm = () => {
	const searchParams = useSearchParams();
	const chatID = searchParams.get("chat_id") ?? "";
	const messageID = searchParams.get("message_id") ?? "";
	const wordParam = searchParams.get("word");
	const { webApp } = useTelegram();
	const initData = webApp?.initData || "";

	const initialWord = wordParam
		? JSON.parse(decodeURIComponent(atob(wordParam)))
		: {};

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<EditWordFormData>({
		resolver: zodResolver(editWordSchema),
		mode: "onSubmit",
		reValidateMode: "onChange",
		defaultValues: {
			id: initialWord._id || "",
			word: initialWord.English || "",
			translation: initialWord.Translation || "",
			example: initialWord.Examples || "",
		},
	});

	const { submit, isLoading: isSubmitting } = useEditWordSubmission();

	const onSubmit = (data: EditWordFormData) => {
		startTransition(() => {
			submit({
				data,
				initData,
				chatID,
				messageID,
				onSubmit: () => webApp?.close(),
			});
		});
	};

	return (
		<form
			className="w-full h-full flex flex-col p-4"
			onSubmit={handleSubmit(onSubmit)}
		>
			<Title className="text-center pb-5" level="1" weight="2">
				Edit word
			</Title>

			<List>
				<Textarea
					{...register("word")}
					header={i18n.word}
					disabled={isSubmitting}
					status={errors.word ? "error" : undefined}
				/>
				<Textarea
					{...register("translation")}
					header={i18n.translation}
					disabled={isSubmitting}
					status={errors.translation ? "error" : undefined}
				/>
				<Textarea
					{...register("example")}
					header={i18n.examples}
					disabled={isSubmitting}
					status={errors.example ? "error" : undefined}
				/>
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

const EditWordPage = () => (
	<Suspense
		fallback={<div className="p-4 text-center text-gray-500">Loading...</div>}
	>
		<EditWordForm />
	</Suspense>
);

export default EditWordPage;
