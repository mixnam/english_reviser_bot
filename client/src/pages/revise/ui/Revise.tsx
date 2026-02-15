import { useSearchParams } from "react-router-dom";
import { Title, Button, Spinner } from "@telegram-apps/telegram-ui";
import { useState } from "react";
import { useGetRandomWordQuery } from "../api/getRandomWord";
import { useUpdateWordProgressMutation } from "../api/updateWordProgress";
import { WordCard } from "./WordCard";

export const Revise = () => {
  const [searchParams] = useSearchParams();
  const chatID = searchParams.get("chat_id") || "";
  const [revealed, setRevealed] = useState(false);

  const {
    data: word,
    isLoading,
    isError,
    refetch,
  } = useGetRandomWordQuery(chatID);
  const updateProgressMutation = useUpdateWordProgressMutation();

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

  if (isError || !word) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4">
        <Title level="2">{i18n.noWords}</Title>
        <Button className="mt-4" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4">
      <Title level="1" weight="2" className="text-center mb-6">
        Revise
      </Title>

      <div className="flex-1 flex flex-col justify-center">
        <WordCard
          word={word}
          revealed={revealed}
          onReveal={() => setRevealed(true)}
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
