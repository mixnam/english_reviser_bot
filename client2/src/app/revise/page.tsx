"use client";

import {
	Button,
	Caption,
	Placeholder,
	Spinner,
	Title,
} from "@telegram-apps/telegram-ui";
import confetti from "canvas-confetti";
import { useSearchParams } from "next/navigation";
import { Suspense, startTransition, useEffect } from "react";
import { useTelegram } from "@/app/telegram";
import { i18n } from "@/shared/lib/i18n";
import { WordCard } from "@/shared/ui/WordCard";
import { useReviseSession } from "./hooks/useReviseSession";

const ReviseContent = () => {
	const searchParams = useSearchParams();
	const chatID = searchParams.get("chat_id") || "";
	const { webApp } = useTelegram();
	const initData = webApp?.initData || "";

	const { word, isLoading, revealed, isError, revealWord, submitDecision } =
		useReviseSession(initData, chatID);

	useEffect(() => {
		if (!isLoading && !word) {
			confetti({
				particleCount: 150,
				spread: 70,
				origin: { y: 0.6 },
				colors: [
					"#26ccff",
					"#a25afd",
					"#ff5e7e",
					"#88ff5a",
					"#fcff42",
					"#ffa62d",
					"#ff36ff",
				],
			});
		}
	}, [isLoading, word]);

	const handleDecision = (remember: boolean) => {
		if (!word) return;

		startTransition(() => {
			submitDecision(word._id, remember);
		});
	};

	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center p-4">
				<Spinner size="l" />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="flex h-full flex-col items-center justify-center p-4">
				<Title level="2">{i18n.noWords}</Title>
				<Button className="mt-4" onClick={() => window.location.reload()}>
					{i18n.retry}
				</Button>
			</div>
		);
	}

	if (!word) {
		return (
			<div className="flex h-full flex-col items-center justify-center p-4">
				<Placeholder header={i18n.congrats} description={i18n.allDone}>
					<picture>
						<source srcSet="https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/512.gif" />
						<img
							alt="Success"
							src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/512.gif"
							style={{ width: 128, height: 128 }}
						/>
					</picture>
				</Placeholder>
				<Button
					size="l"
					className="mt-8 w-full max-w-xs"
					onClick={() => {
						webApp?.close();
					}}
				>
					{i18n.close}
				</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full p-4">
			<Title level="1" weight="2" className="text-center mb-6">
				{i18n.revise}
			</Title>

			<div className="flex-1 flex flex-col justify-center min-h-0">
				<WordCard
					word={word}
					revealed={revealed}
					onReveal={() => revealWord()}
				/>
			</div>

			<div className="text-center my-4">
				<Caption weight="1" caps className="text-gray-800 tracking-widest">
					{i18n.doYouRemember}
				</Caption>
			</div>

			<div className="flex gap-4 pb-4 shrink-0">
				<Button
					stretched
					size="l"
					mode="bezeled"
					className="bg-rose-200! text-rose-700!"
					onClick={() => handleDecision(false)}
					loading={isLoading}
					disabled={isLoading}
				>
					{i18n.no}
				</Button>
				<Button
					stretched
					size="l"
					mode="bezeled"
					className="bg-emerald-200! text-emerald-700!"
					onClick={() => handleDecision(true)}
					loading={isLoading}
					disabled={isLoading}
				>
					{i18n.yes}
				</Button>
			</div>
		</div>
	);
};

const RevisePage = () => (
	<Suspense
		fallback={
			<div className="flex h-full items-center justify-center p-4">
				<Spinner size="l" />
			</div>
		}
	>
		<ReviseContent />
	</Suspense>
);

export default RevisePage;
