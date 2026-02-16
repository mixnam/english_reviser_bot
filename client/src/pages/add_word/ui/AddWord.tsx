import { useSearchParams } from "react-router-dom";
import {
  List,
  Button,
  Textarea,
  Title,
  Caption,
  IconButton,
} from "@telegram-apps/telegram-ui";
import React, { useEffect, useState, useRef } from "react";
import { useCheckSimilarWorkQuery } from "../api/checkSimilarWords";
import { useGetExamplesQuery } from "../api/getExamples";
import { useSubmitWordMutation } from "../api/submitWord";
import {
  useSearchImagesQuery,
  Params as SearchImageParams,
} from "../api/searchImages";
import WebApp from "@twa-dev/sdk";
import { ReloadIcon } from "../../../shared/ui/ReloadIcon";
import { ImagePreview } from "../../../shared/ui/ImagePreview";

let timeout: number;
let longPressTimer: ReturnType<typeof setTimeout> | null = null;

const debounce = (callback: () => void, time: number) => () => {
  clearTimeout(timeout);
  timeout = setTimeout(() => callback(), time);
};

export const AddWord = () => {
  const [searchParams] = useSearchParams();
  const chatIDParam = searchParams.get("chat_id");

  const [word, setWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [example, setExample] = useState("");
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | Blob | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onTouchStart = (url: string) => {
    longPressTimer = setTimeout(() => {
      setPreviewUrl(url);
      longPressTimer = null;
    }, 1000);
  };

  const onTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  };

  const [searchImageParams, setSearchImageParams] = useState<SearchImageParams>(
    {
      chatID: chatIDParam ?? "",
      word,
      translation,
      offset: 0,
      enabled: false,
    },
  );

  const checkSimilarWordQuery = useCheckSimilarWorkQuery({
    chatID: chatIDParam ?? "",
    word,
  });
  const getExamplesQuery = useGetExamplesQuery({
    chatID: chatIDParam ?? "",
    word,
    translation,
  });
  const searchImagesQuery = useSearchImagesQuery(searchImageParams);

  const handleLocalFile = (file: File | Blob) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setSelectedImageUrl(null);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleLocalFile(file);
    }
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((item) => item.type.startsWith("image/"));

    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) {
        handleLocalFile(file);
      }
    }
  };

  const submitWordMutation = useSubmitWordMutation();

  const checkSimilarWordDebounced = debounce(
    () => checkSimilarWordQuery.refetch(),
    1000,
  );

  const onChangeWord = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.currentTarget.value;
    setWord(value);
    setSearchImageParams((params) => ({
      ...params,
      word: value,
      offset: 0,
      enabled: false,
    }));
    setSelectedImageUrl(null);
    setSelectedFile(null);
    setFilePreview(null);
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

  const onSearchImages = () => {
    setSearchImageParams((params) => ({
      ...params,
      offset: searchImagesQuery.data ? (params.offset ?? 0) + 5 : 0,
      enabled: true,
    }));
  };

  const onSelectRemoteImage = (url: string) => {
    setSelectedImageUrl(url);
    setSelectedFile(null);
    setFilePreview(null);
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
        file: selectedFile ?? undefined,
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
    <form
      className="w-full h-full flex flex-col p-4"
      onSubmit={onSubmit}
      onPaste={onPaste}
    >
      <Title className="text-center pb-5" level="1" weight="2">
        Add new word
      </Title>
      <List>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={onFileChange}
        />
        <Textarea
          name="english"
          header={i18n.word}
          onChange={onChangeWord}
          disabled={isPending || submitWordMutation.isPending}
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
          disabled={isPending || submitWordMutation.isPending}
        />
        <Textarea
          name="examples"
          header={i18n.examples}
          disabled={isPending || submitWordMutation.isPending}
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
            disabled={isPending || submitWordMutation.isPending}
          >
            <ReloadIcon size={18} />
          </IconButton>
        </div>

        <div className="flex items-center justify-between px-[22px]">
          <Caption>Search Image</Caption>
          <div className="flex items-center gap-2">
            <Button
              size="s"
              mode="bezeled"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={submitWordMutation.isPending}
            >
              Upload
            </Button>
            <IconButton
              size="s"
              mode="plain"
              type="button"
              onClick={onSearchImages}
              disabled={isPending || submitWordMutation.isPending}
            >
              <ReloadIcon size={18} />
            </IconButton>
          </div>
        </div>

        {!!searchImagesQuery.data?.urls.length && (
          <div className="flex gap-2 overflow-x-auto px-[22px] pb-4">
            {searchImagesQuery.data.urls.map((url) => (
              <div
                key={url}
                className={`shrink-0 cursor-pointer border-2 rounded-lg overflow-hidden ${selectedImageUrl === url ? "border-[#007aff]" : "border-transparent"}`}
                onClick={() => onSelectRemoteImage(url)}
                onTouchStart={() => onTouchStart(url)}
                onTouchEnd={onTouchEnd}
                onTouchMove={onTouchEnd}
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

        {filePreview && (
          <div className="flex gap-2 px-[22px] pb-4">
            <div
              className="shrink-0 cursor-pointer border-2 rounded-lg overflow-hidden border-[#007aff]"
              onTouchStart={() => onTouchStart(filePreview)}
              onTouchEnd={onTouchEnd}
              onTouchMove={onTouchEnd}
            >
              <img
                src={filePreview}
                alt="preview"
                className="h-24 w-24 object-cover"
              />
            </div>
          </div>
        )}
      </List>
      <div className="flex flex-1 flex-col justify-end">
        <Button
          className="max-h-12"
          type="submit"
          stretched
          disabled={isDisabled || submitWordMutation.isPending}
          loading={submitWordMutation.isPending}
        >
          {i18n.save}
        </Button>
      </div>
      {previewUrl && (
        <ImagePreview url={previewUrl} onClose={() => setPreviewUrl(null)} />
      )}
    </form>
  );
};
