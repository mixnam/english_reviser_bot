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
import EditWord from "@/features/edit-word";

const LearnContent = () => {
	const searchParams = useSearchParams();
	const chatID = searchParams.get("chat_id") || "";
	const { webApp } = useTelegram();
	const initData = webApp?.initData || "";
	const didConfetti = useRef(false);

	const {
		state,
		isLoading,
		revealWord,
		submitDecision,
		editWord,
		continueLearn,
	} = useLearnSession(initData, chatID);

	useEffect(() => {
		if (!isLoading && state.type === "completed" && !didConfetti.current) {
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
	}, [state, isLoading]);

	const handleDecision = (remember: boolean) => {
		if (state.type === "word") {
			startTransition(() => {
				submitDecision(state.word._id, remember);
			});
		}
	};

	switch (state.type) {
		case "init":
			return (
				<div className="flex h-full items-center justify-center p-4">
					<Spinner size="l" />
				</div>
			);
		case "error":
			return (
				<div className="flex h-full flex-col items-center justify-center p-4">
					<Title level="2">{i18n.noWordsLearn}</Title>
					<Button className="mt-4" onClick={() => window.location.reload()}>
						{i18n.retry}
					</Button>
				</div>
			);
		case "completed":
			return (
				<LearnCompletionSummary
					before={state.before}
					after={state.summary.stats}
					sessionWordCount={state.sessionWordCount}
					onClose={() => webApp?.close()}
				/>
			);
		case "no_words":
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
		case "word": {
			const { word, revealed } = state;
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
							onEditClick={() => editWord()}
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
		}
		case "editing": {
			return (
				<EditWord
					word={state.word}
					chatID={chatID}
					onClose={() => {
						continueLearn(state.word);
					}}
					onEditSuccess={(word) => {
						continueLearn(word);
					}}
					onWordDeleted={() => {
						continueLearn(null);
					}}
				/>
			);
		}
	}
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
