"use client";

import { AppRoot } from "@telegram-apps/telegram-ui";
import { createContext, use, useContext } from "react";
import type WebApp from "@twa-dev/sdk";

import "@telegram-apps/telegram-ui/dist/styles.css";

type TelegramContextType = {
	webApp: typeof WebApp | null;
};

const TelegramContext = createContext<TelegramContextType>({
	webApp: null,
});

export const useTelegram = () => useContext(TelegramContext);

const telegramWebAppPromise =
	typeof window !== "undefined"
		? import("@twa-dev/sdk").then((mod) => {
				const WebApp = mod.default;
				WebApp.ready();
				WebApp.expand();
				return {
					webApp: WebApp,
				};
			})
		: Promise.resolve<TelegramContextType>({ webApp: null });

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
