import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AddWord } from "../pages/add_word";

const Component = () => {
  const { chat_id } = Route.useSearch();

  return <AddWord chatID={chat_id} />;
};

const validateParams = z.object({
  chat_id: z.string().catch(""),
});

export const Route = createFileRoute("/add-word")({
  component: Component,
  validateSearch: validateParams,
  ssr: false,
});
