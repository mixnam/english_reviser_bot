import React from "react";

type Props = {
	size: number;
} & React.SVGProps<SVGSVGElement>;

export const EditIcon = ({ size, ...props }: Props) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		{...props}
	>
		<path
			d="M16.4745 5.40801L18.5917 7.52522M17.8358 3.54271L12.5168 8.86171C12.1158 9.26271 11.8318 9.77121 11.7008 10.3236L11.0181 13.1979C10.9632 13.4293 11.0315 13.6732 11.1983 13.84C11.3651 14.0068 11.609 14.0751 11.8404 14.0202L14.7147 13.3375C15.2671 13.2065 15.7756 12.9225 16.1766 12.5215L21.4956 7.20251C22.5057 6.19241 22.5057 4.55281 21.4956 3.54271C20.4855 2.53261 18.8459 2.53261 17.8358 3.54271Z"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
		<path
			d="M19 15V18C19 19.1046 18.1046 20 17 20H6C4.89543 20 4 19.1046 4 18V7C4 5.89543 4.89543 5 6 5H9"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);
