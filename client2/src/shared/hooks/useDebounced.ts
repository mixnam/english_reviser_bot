import { useEffect, useRef, useState } from "react";

export const useDebounced = <T>(value: T, delay: number): T => {
	const [currentValue, setCurrentValue] = useState(value);
	const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		timeout.current && clearTimeout(timeout.current);
		timeout.current = setTimeout(() => {
			setCurrentValue(value);
		}, delay);
		return () => {
			timeout.current && clearTimeout(timeout.current);
		};
	}, [value, delay]);

	return currentValue;
};
