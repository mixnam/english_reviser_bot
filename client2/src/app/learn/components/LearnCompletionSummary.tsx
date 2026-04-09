"use client";

import {
	Button,
	Caption,
	Placeholder,
	Title,
} from "@telegram-apps/telegram-ui";
import { CSSProperties, useEffect, useMemo, useState } from "react";
import type { ProgressStats } from "@/shared/api/types";
import { i18n } from "@/shared/lib/i18n";

const progressOrder = [
	"Have problems",
	"Have to pay attention",
	"Need to repeat",
	"Active learning",
	"Learned",
] as const;

const bucketLabel: Record<(typeof progressOrder)[number], string> = {
	"Have problems": i18n.progress.haveProblems,
	"Have to pay attention": i18n.progress.payAttention,
	"Need to repeat": i18n.progress.needRepeat,
	"Active learning": i18n.progress.activeLearning,
	Learned: i18n.progress.learned,
};

const bucketColor: Record<(typeof progressOrder)[number], string> = {
	"Have problems": "bg-rose-500",
	"Have to pay attention": "bg-orange-500",
	"Need to repeat": "bg-amber-500",
	"Active learning": "bg-sky-500",
	Learned: "bg-emerald-500",
};

const weightedProgress = (stats: ProgressStats) => {
	const total = progressOrder.reduce((sum, key) => sum + (stats[key] || 0), 0);
	if (!total) return 0;
	const weights = progressOrder.reduce<Record<string, number>>(
		(acc, key, index) => {
			acc[key] = index;
			return acc;
		},
		{},
	);
	const weighted = progressOrder.reduce(
		(sum, key) => sum + (stats[key] || 0) * weights[key],
		0,
	);
	return Math.round((weighted / (total * (progressOrder.length - 1))) * 100);
};

export const LearnCompletionSummary = ({
	before,
	after,
	sessionWordCount,
	onClose,
}: {
	before: ProgressStats | null;
	after: ProgressStats;
	sessionWordCount: number;
	onClose: () => void;
}) => {
	const [animateAfter, setAnimateAfter] = useState(false);
	useEffect(() => {
		const t = window.setTimeout(() => setAnimateAfter(true), 500);
		return () => window.clearTimeout(t);
	}, []);

	const rows = useMemo(() => {
		const maxBucketAfter = Object.entries(after).reduce(
			(res, [key, val]) => (key === "Learned" ? res : Math.max(res, val)),
			0,
		);

		const rows = progressOrder.map((key) => ({
			key,
			label: bucketLabel[key],
			color: bucketColor[key],
			before: before?.[key] || 0,
			after: after[key] || 0,
			progressAfter: ((after[key] || 0) / maxBucketAfter) * 100,
			progressBefore: ((before?.[key] || 0) / maxBucketAfter) * 100,
		}));

		return rows;
	}, [after, before]);

	const beforeProgress = weightedProgress(before || after);
	const afterProgress = weightedProgress(after);

	if (!sessionWordCount) {
		return (
			<div className="flex h-full flex-col items-center justify-center p-4">
				<Placeholder header={i18n.congrats} description={i18n.allDoneLearn} />
				<Button size="l" className="mt-8 w-full max-w-xs" onClick={onClose}>
					{i18n.close}
				</Button>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col p-4 gap-4 overflow-y-auto">
			<div className="rounded-3xl bg-white/90 p-5 shadow-lg ring-1 ring-black/5">
				<Title level="2" className="text-center">
					{i18n.congrats}
				</Title>
				<Caption className="mt-2 text-center">
					{i18n.studiedWordsCountPrefix}
					{sessionWordCount}
					{i18n.studiedWordsCountSuffix}
				</Caption>
				<div className="mt-4">
					<div className="flex justify-between text-sm mb-2">
						<span>{i18n.progressTitle}</span>
						<span>
							{beforeProgress}% → {afterProgress}%
						</span>
					</div>
					<div className="h-3 rounded-full bg-slate-200 overflow-hidden">
						<div
							className="h-full bg-slate-400 transition-all duration-700"
							style={{ width: animateAfter ? `${beforeProgress}%` : "0%" }}
						/>
						<div
							className="-mt-3 h-3 rounded-full bg-emerald-500 transition-all duration-700"
							style={{
								width: animateAfter
									? `${afterProgress}%`
									: `${beforeProgress}%`,
							}}
						/>
					</div>
				</div>
			</div>

			<div className="space-y-3">
				{rows.map((row, index) => {
					const delta = row.after - row.before;
					return (
						<div
							key={row.key}
							className="rounded-2xl bg-white/90 p-4 shadow ring-1 ring-black/5 transition-all duration-500"
							style={{ transitionDelay: `${index * 70}ms` }}
						>
							<div className="flex items-center justify-between gap-3">
								<div>
									<div className="font-medium">{row.label}</div>
									<div className="text-xs text-gray-500">
										{row.after} {i18n.wordsCount}
									</div>
								</div>
								<div className="flex flex-row items-center gap-1">
									{delta > 0 && (
										<div
											className={`rounded-full p-1 text-xs bg-green-100 text-green-600 transition-opacity duration-1000 ${animateAfter ? "opacity-100" : "opacity-0"} `}
										>
											+{delta}
										</div>
									)}
									<div
										style={
											{
												"--num": animateAfter ? row.after : row.before,
											} as CSSProperties
										}
										className={`rounded-full px-2 py-1 text-xs font-semibold bg-slate-100 text-slate-700 transition-[--num] duration-1000 counter-reset counter-content`}
									></div>
								</div>
							</div>
							<div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
								<div
									className={`h-full ${row.color} transition-all duration-700 ease-out`}
									style={{
										width: animateAfter
											? `${row.progressAfter}%`
											: `${row.progressBefore}%`,
									}}
								/>
							</div>
						</div>
					);
				})}
			</div>

			<Button size="l" className="mt-auto w-full" onClick={onClose}>
				{i18n.close}
			</Button>
		</div>
	);
};
