import React from "react";

type Props = {
        size: number;
} & React.SVGProps<SVGSVGElement>;

export const BackIcon = ({ size, ...props }: Props) => (
        <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                {...props}
        >
                <path
                        d="M15 18L9 12L15 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                />
        </svg>
);
