import { Button } from "@telegram-apps/telegram-ui";
import type { Word } from "@/shared/api/types";
import { i18n } from "@/shared/lib/i18n";
import { WordCard } from "@/shared/ui/WordCard";

type Props = {
	word: Word;
	onClose: () => void;
	onAddNewWordClick: () => void;
};

export const NewWordCard = ({ word, onClose, onAddNewWordClick }: Props) => {
	return (
		<div className="w-full h-full flex flex-col p-4">
			<WordCard word={word} revealed={true} onReveal={() => undefined} />
			<div className="flex flex-col justify-end mt-4 gap-2">
				<Button
					className="max-h-12"
					type="button"
					stretched
					onClick={onAddNewWordClick}
				>
					{i18n.addNewWord}
				</Button>
				<Button
					className="max-h-12"
					mode="plain"
					type="button"
					stretched
					onClick={onClose}
				>
					{i18n.close}
				</Button>
			</div>
		</div>
	);
};
