import { useCallback, useEffect, useRef } from "react";

export const useDebounced = <T>(
	callback: (...args: T[]) => void,
	delay: number,
): [(...args: T[]) => void, () => void] => {
	const timeout = useRef(0);

	useEffect(() => {
		return () => {
			clearTimeout(timeout.current);
		};
	}, []);

	const debounced = useCallback(
		(...args: T[]) => {
			clearTimeout(timeout.current);
			timeout.current = setTimeout(() => callback(...args), delay);
		},
		[callback, delay],
	);

	const cancel = useCallback(() => {
		clearTimeout(timeout.current);
	}, []);

	return [debounced, cancel];
};
