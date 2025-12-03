import { useSearchParams } from "react-router-dom";
import { List, Button, Textarea } from "@telegram-apps/telegram-ui";
import { EditableWord } from "../model";
import { useSaveWordMutation } from "../api/saveWord";
import React from "react";
import WebApp from "@twa-dev/sdk";

export const EditWord = () => {
  const [searchParams] = useSearchParams();
  const wordParam = searchParams.get("word");
  const chatIDParam = searchParams.get("chat_id");
  const messageIDParam = searchParams.get("message_id");
  const word: EditableWord = wordParam
    ? JSON.parse(decodeURIComponent(atob(wordParam)))
    : {};

  const saveWordMutation = useSaveWordMutation();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const englishValue = (
      e.currentTarget.elements.namedItem("english") as HTMLInputElement
    ).value;
    const translationValue = (
      e.currentTarget.elements.namedItem("translation") as HTMLInputElement
    ).value;
    const examplesValue = (
      e.currentTarget.elements.namedItem("examples") as HTMLInputElement
    ).value;

    saveWordMutation.mutate(
      {
        chatID: chatIDParam ?? "",
        messageID: messageIDParam ?? "",
        word: {
          _id: word._id,
          English: englishValue,
          Translation: translationValue,
          Examples: examplesValue,
        },
      },
      {
        onSuccess: () => {
          WebApp.close();
        },
      },
    );
  };

  return (
    <form onSubmit={onSubmit}>
      <List>
        <Textarea
          name="english"
          header={i18n.word}
          defaultValue={word.English}
        />
        <Textarea
          name="translation"
          header={i18n.translation}
          defaultValue={word.Translation}
        />
        <Textarea
          name="examples"
          header={i18n.examples}
          defaultValue={word.Examples}
        />
        <Button type="submit" loading={saveWordMutation.isPending}>
          {i18n.save}
        </Button>
      </List>
    </form>
  );
};
