"use client";

import { AppRoot } from "@telegram-apps/telegram-ui";
import { createContext, use, useContext } from "react";

import "@telegram-apps/telegram-ui/dist/styles.css";

interface TelegramContextType {
	initData: string;
}

const TelegramContext = createContext<TelegramContextType>({
	initData: "",
});

export const useTelegram = () => useContext(TelegramContext);


const telegramWebAppPromise =
	typeof window !== "undefined"
		? import("@twa-dev/sdk").then((mod) => {
				const WebApp = mod.default;
				WebApp.ready();
				WebApp.expand();
				return {
					initData: WebApp.initData || "",
				};
			})
		: Promise.resolve({ initData: "" });

export const TelegramWebAppProvider = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const state = use(telegramWebAppPromise);

	return (
		<TelegramContext.Provider value={state}>
			<AppRoot className="h-full w-full">{children}</AppRoot>
		</TelegramContext.Provider>
	);
};
