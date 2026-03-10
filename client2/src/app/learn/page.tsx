"use client";

import {
	Button,
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
import { useLearnSession } from "./hooks/useLearnSession";

const LearnContent = () => {
	const searchParams = useSearchParams();
	const chatID = searchParams.get("chat_id") || "";
	const { initData } = useTelegram();

	const { word, revealed, isLoading, isError, revealWord, submitDecision } = useLearnSession(
		initData,
		chatID,
	);

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

	if (isLoading && !word) {
		return (
			<div className="flex h-full items-center justify-center p-4">
				<Spinner size="l" />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="flex h-full flex-col items-center justify-center p-4">
				<Title level="2">{i18n.noWordsLearn}</Title>
				<Button className="mt-4" onClick={() => window.location.reload()}>
					Retry
				</Button>
			</div>
		);
	}

	if (!word) {
		return (
			<div className="flex h-full flex-col items-center justify-center p-4">
				<Placeholder header={i18n.congrats} description={i18n.allDoneLearn}>
					<picture>
						<source srcSet="https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/512.gif" />
						<img
							alt="Success"
							src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/512.gif"
							style={{ width: 128, height: 128 }}
						/>
					</picture>
				</Placeholder>
				<Button size="l" className="mt-8 w-full max-w-xs">
					{i18n.close}
				</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full p-4">
			<Title level="1" weight="2" className="text-center mb-6">
				Learn
			</Title>

			<div className="flex-1 flex flex-col justify-center">
				<WordCard
					word={word}
					revealed={revealed}
					onReveal={() => revealWord()}
				/>
			</div>

			<div className="text-center mt-auto mb-6">
				<Title level="3">{i18n.doYouRemember}</Title>
			</div>

			<div className="flex gap-4 pb-4 shrink-0">
				<Button
					stretched
					size="l"
					mode="bezeled"
					color="negative"
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

const LearnPage = () => (
	<Suspense
		fallback={
			<div className="flex h-full items-center justify-center p-4">
				<Spinner size="l" />
			</div>
		}
	>
		<LearnContent />
	</Suspense>
);

export default LearnPage;
