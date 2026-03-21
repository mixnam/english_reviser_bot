"use client";

import {
	Button,
	Caption,
	Card,
	IconButton,
	Text,
} from "@telegram-apps/telegram-ui";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Word } from "../api/types";
import { i18n } from "../lib/i18n";
import { EditIcon } from "./EditIcon";

interface WordCardProps {
	word: Word;
	revealed: boolean;
	onReveal: () => void;
}

const progressShadowMap: Record<string, string> = {
	"Have problems": "shadow-rose-200", // red
	"Have to pay attention": "shadow-orange-200", // orange
	"Need to repeat": "shadow-yellow-200", // yellow
	"Active learning": "shadow-blue-200", // blue
	Learned: "shadow-green-200", // green
};

export const WordCard = ({ word, revealed, onReveal }: WordCardProps) => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const chatID = searchParams.get("chat_id") || "";

	const audioRef = useRef<HTMLAudioElement | null>(null);
	const [revealedExample, setRevealedExample] = useState(false);

	useEffect(() => {
		setRevealedExample(false);
	}, [word._id]);

	const playAudio = () => {
		if (audioRef.current) {
			audioRef.current.play();
		}
	};

	const onEdit = () => {
		const encodedWord = btoa(encodeURIComponent(JSON.stringify(word)));
		router.push(`/edit-word?chat_id=${chatID}&word=${encodedWord}`);
	};

	const shadowClass = progressShadowMap[word.Progress] || "";

	return (
		<div className={`rounded-2xl shadow-2xl ${shadowClass}`}>
			<Card className="flex flex-col w-full h-full overflow-hidden relative">
				<div className="absolute top-2 right-2 z-10">
					<IconButton size="s" mode="bezeled" onClick={onEdit}>
						<EditIcon size={20} />
					</IconButton>
				</div>
				{word.ImageURL && (
					<img
						src={word.ImageURL}
						alt={word.English}
						className="w-full h-fit max-h-svw object-contain"
					/>
				)}
				<div className="p-4 flex flex-col items-center gap-3">
					<Text weight="1" className="text-2xl whitespace-pre-wrap text-center">
						{word.English}
					</Text>

					{word.Examples && (
						<div className="flex flex-col items-center gap-2 w-full">
							{revealedExample ? (
								<Caption className="italic text-gray-500 whitespace-pre-wrap text-center px-4">
									"{word.Examples}"
								</Caption>
							) : (
								<Button
									size="s"
									mode="outline"
									onClick={() => setRevealedExample(true)}
								>
									{i18n.showExample}
								</Button>
							)}
						</div>
					)}

					{word.AudioURL && (
						<div className="flex items-center gap-2">
							<audio ref={audioRef} src={word.AudioURL} />
							<Button size="s" mode="outline" onClick={playAudio}>
								{i18n.playAudio}
							</Button>
						</div>
					)}

					{!revealed ? (
						<Button mode="bezeled" onClick={onReveal}>
							{i18n.reveal}
						</Button>
					) : (
						<div className="flex flex-col items-center gap-2 text-center">
							<Text weight="2" className="text-blue-500 whitespace-pre-wrap">
								{word.Translation}
							</Text>
						</div>
					)}
				</div>
			</Card>
		</div>
	);
};
