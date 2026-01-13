import {
  List,
  Button,
  Textarea,
  Title,
  Caption,
  IconButton,
} from "@telegram-apps/telegram-ui";
import React, { useEffect, useState } from "react";
import { useCheckSimilarWorkQuery } from "../api/checkSimilarWords";
import { useGetExamplesQuery } from "../api/getExamples";
import { useSubmitWordMutation } from "../api/submitWord";
import { useSearchImagesQuery } from "../api/searchImages";
import WebApp from "@twa-dev/sdk";
import { ReloadIcon } from "./ReloadIcon";

let timeout: number;

const debounce = (callback: () => void, time: number) => () => {
  clearTimeout(timeout);
  timeout = setTimeout(() => callback(), time);
};

type Props = {
  chatID: string;
};

export const AddWord = ({ chatID }: Props) => {
  const chatIDParam = chatID;

  const [word, setWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [example, setExample] = useState("");
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const checkSimilarWordQuery = useCheckSimilarWorkQuery({
    chatID: chatIDParam ?? "",
    word,
  });
  const getExamplesQuery = useGetExamplesQuery({
    chatID: chatIDParam ?? "",
    word,
    translation,
  });
  const searchImagesQuery = useSearchImagesQuery({
    chatID: chatIDParam ?? "",
    word,
    translation,
  });

  const submitWordMutation = useSubmitWordMutation();

  const checkSimilarWordDebounced = debounce(
    () => checkSimilarWordQuery.refetch(),
    1000,
  );

  const onChangeWord = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.currentTarget.value;
    setWord(value);
    if (value) {
      checkSimilarWordDebounced();
    }
  };

  const onChangeTranslation = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.currentTarget.value;
    setTranslation(value);
  };

  const onChangeExample = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setExample(e.currentTarget.value);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    submitWordMutation.mutate(
      {
        chatID: chatIDParam ?? "",
        word,
        translation,
        example,
        imageUrl: selectedImageUrl,
      },
      {
        onSuccess: () => {
          WebApp.close();
        },
      },
    );
  };

  useEffect(() => {
    if (getExamplesQuery.data) {
      setExample(getExamplesQuery.data.example);
    }
  }, [getExamplesQuery.data]);

  const isPending =
    checkSimilarWordQuery.isFetching ||
    getExamplesQuery.isFetching ||
    searchImagesQuery.isFetching;

  const isDisabled = !word || !translation;

  return (
    <form className="w-full h-full flex flex-col p-4" onSubmit={onSubmit}>
      <Title className="text-center pb-5" level="1" weight="2">
        Add new word
      </Title>
      <List>
        <Textarea
          name="english"
          header={i18n.word}
          onChange={onChangeWord}
          disabled={isPending}
          status={
            checkSimilarWordQuery.data?.words.length ? "error" : undefined
          }
        />
        {!!checkSimilarWordQuery.data?.words.length && (
          <div className="flex items-center text-red-600 justify-between px-[22px] pb-2 -mt-3 z-50">
            <Caption>
              You have similar words added:{" "}
              {checkSimilarWordQuery.data.words.join(",")}
            </Caption>
          </div>
        )}
        <Textarea
          name="translation"
          header={i18n.translation}
          onChange={onChangeTranslation}
          disabled={isPending}
        />
        <Textarea
          name="examples"
          header={i18n.examples}
          disabled={isPending}
          value={example}
          onChange={onChangeExample}
        />
        <div className="flex items-center justify-between px-[22px] pb-2 -mt-5">
          <Caption>Generate example</Caption>
          <IconButton
            size="s"
            mode="plain"
            type="button"
            onClick={() => getExamplesQuery.refetch()}
          >
            <ReloadIcon size={18} />
          </IconButton>
        </div>

        <div className="flex items-center justify-between px-[22px]">
          <Caption>Search Image</Caption>
          <IconButton
            size="s"
            mode="plain"
            type="button"
            onClick={() => searchImagesQuery.refetch()}
          >
            <ReloadIcon size={18} />
          </IconButton>
        </div>

        {!!searchImagesQuery.data?.urls.length && (
          <div className="flex gap-2 overflow-x-auto px-[22px] pb-4">
            {searchImagesQuery.data.urls.map((url) => (
              <div
                key={url}
                className={`shrink-0 cursor-pointer border-2 rounded-lg overflow-hidden ${selectedImageUrl === url ? "border-[#007aff]" : "border-transparent"}`}
                onClick={() => setSelectedImageUrl(url)}
              >
                <img
                  src={url}
                  alt="result"
                  className="h-24 w-24 object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </List>
      <div className="flex flex-1 flex-col justify-end">
        <Button
          className="max-h-12"
          type="submit"
          stretched
          disabled={isDisabled}
          loading={isPending}
        >
          {i18n.save}
        </Button>
      </div>
    </form>
  );
};
