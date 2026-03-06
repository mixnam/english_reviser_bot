import { Suspense } from "react";
import { TelegramWebAppProvider } from "./telegram";

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<Suspense
			fallback={
				<div className="flex h-screen items-center justify-center bg-white text-gray-500 font-medium">
					Loading...
				</div>
			}
		>
			<TelegramWebAppProvider>{children}</TelegramWebAppProvider>
		</Suspense>
	);
}
