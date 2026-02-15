import { Card, Text, Caption, Button } from "@telegram-apps/telegram-ui";
import { Word } from "../api/getRandomWord";
import { useRef } from "react";

interface WordCardProps {
  word: Word;
  revealed: boolean;
  onReveal: () => void;
}

export const WordCard = ({ word, revealed, onReveal }: WordCardProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  return (
    <div className="rounded-2xl shadow-2xl">
      <Card className="flex flex-col overflow-hidden mb-4">
        {word.ImageURL && (
          <img
            src={word.ImageURL}
            alt={word.English}
            className="w-full h-fit max-h-svw object-contain"
          />
        )}
        <div className="p-4 flex flex-col items-center gap-3">
          <Text weight="1" className="text-2xl">
            {word.English}
          </Text>

          {word.AudioURL && (
            <div className="flex items-center gap-2">
              <audio ref={audioRef} src={word.AudioURL} />
              <Button size="s" mode="outline" onClick={playAudio}>
                Play Audio
              </Button>
            </div>
          )}

          {!revealed ? (
            <Button mode="bezeled" onClick={onReveal}>
              {i18n.reveal}
            </Button>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center">
              <Text weight="2" className="text-blue-500">
                {word.Translation}
              </Text>
              {word.Examples && (
                <Caption className="italic text-gray-500">
                  "{word.Examples}"
                </Caption>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
