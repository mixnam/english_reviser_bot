import { useSearchParams } from "react-router-dom";
import {
  Title,
  Button,
  Spinner,
  Placeholder,
} from "@telegram-apps/telegram-ui";
import { useState, useEffect } from "react";
import { useGetRandomLearnWordQuery } from "../api/getRandomWord";
import { useUpdateLearnWordProgressMutation } from "../api/updateWordProgress";
import { WordCard } from "../../../shared/ui/WordCard";
import confetti from "canvas-confetti";
import WebApp from "@twa-dev/sdk";

export const Learn = () => {
  const [searchParams] = useSearchParams();
  const chatID = searchParams.get("chat_id") || "";
  const [revealed, setRevealed] = useState(false);

  const {
    data: word,
    isLoading,
    isError,
    refetch,
  } = useGetRandomLearnWordQuery(chatID);
  const updateProgressMutation = useUpdateLearnWordProgressMutation();

  useEffect(() => {
    if (!isLoading && !word && !isError) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: [
          "#26ccff",
          "#a25afd",
          "#ff5e7e",
          "#88ff5a",
          "#fcff42",
          "#ffa62d",
          "#ff36ff",
        ],
      });
    }
  }, [isLoading, word, isError]);

  const handleDecision = (remember: boolean) => {
    if (!word) return;

    updateProgressMutation.mutate(
      {
        chatID,
        wordID: word._id,
        remember,
      },
      {
        onSuccess: () => {
          setRevealed(false);
          refetch();
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="l" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4">
        <Title level="2">{i18n.noWordsLearn}</Title>
        <Button className="mt-4" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!word) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4">
        <Placeholder header={i18n.congrats} description={i18n.allDoneLearn}>
          <img
            alt="Success"
            src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/512.gif"
            style={{ width: 128, height: 128 }}
          />
        </Placeholder>
        <Button
          size="l"
          className="mt-8 w-full max-w-xs"
          onClick={() => WebApp.close()}
        >
          {i18n.close}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4">
      <Title level="1" weight="2" className="text-center mb-6">
        Learn
      </Title>

      <div className="flex-1 flex flex-col justify-center">
        <WordCard
          word={word}
          revealed={revealed}
          onReveal={() => setRevealed(true)}
          progress={word.Progress}
        />
      </div>

      <div className="text-center mt-4 mb-6">
        <Title level="3">{i18n.doYouRemember}</Title>
      </div>

      <div className="flex gap-4 pb-4">
        <Button
          stretched
          size="l"
          mode="bezeled"
          color="negative"
          onClick={() => handleDecision(false)}
          loading={updateProgressMutation.isPending}
        >
          {i18n.no}
        </Button>
        <Button
          stretched
          size="l"
          mode="bezeled"
          className="bg-green-50"
          onClick={() => handleDecision(true)}
          loading={updateProgressMutation.isPending}
        >
          {i18n.yes}
        </Button>
      </div>
    </div>
  );
};
