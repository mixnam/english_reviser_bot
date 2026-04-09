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
import { Suspense, startTransition, useEffect, useRef } from "react";
import { useTelegram } from "@/app/telegram";
import { i18n } from "@/shared/lib/i18n";
import { WordCard } from "@/shared/ui/WordCard";
import { LearnCompletionSummary } from "./components/LearnCompletionSummary";
import { useLearnSession } from "./hooks/useLearnSession";

const LearnContent = () => {
	const searchParams = useSearchParams();
	const chatID = searchParams.get("chat_id") || "";
	const { webApp } = useTelegram();
	const initData = webApp?.initData || "";
	const didConfetti = useRef(false);

	const {
		word,
		revealed,
		isLoading,
		isError,
		revealWord,
		submitDecision,
		completionSummary,
		beforeStats,
		sessionWordCount,
	} = useLearnSession(initData, chatID);

	useEffect(() => {
		if (!isLoading && !word && completionSummary && !didConfetti.current) {
			didConfetti.current = true;
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
	}, [completionSummary, isLoading, word]);

	const handleDecision = (remember: boolean) => {
		if (!word) return;

		startTransition(() => {
			submitDecision(word._id, remember);
		});
	};

	if (isLoading && !word && !completionSummary) {
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
					{i18n.retry}
				</Button>
			</div>
		);
	}

	if (completionSummary) {
		return (
			<LearnCompletionSummary
				before={beforeStats}
				after={completionSummary.stats}
				sessionWordCount={sessionWordCount}
				onClose={() => webApp?.close()}
			/>
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
				<Button
					size="l"
					className="mt-8 w-full max-w-xs"
					onClick={() => webApp?.close()}
				>
					{i18n.close}
				</Button>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col p-4">
			<Title level="1" weight="2" className="mb-6 text-center">
				{i18n.learn}
			</Title>

			<div className="flex min-h-0 flex-1 flex-col justify-center">
				<WordCard
					word={word}
					revealed={revealed}
					onReveal={() => revealWord()}
				/>
			</div>

			<div className="my-4 text-center">
				<Caption weight="1" caps className="tracking-widest text-gray-800">
					{i18n.doYouRemember}
				</Caption>
			</div>

			<div className="shrink-0 gap-4 pb-4 flex">
				<Button
					stretched
					size="l"
					mode="bezeled"
					className="bg-rose-200! text-rose-700!"
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
