import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

const i18n = {
  en: {
    word: "English",
    translation: "Translation",
    examples: "Examples",
    save: "Save",
  },
  pt: {
    word: "Palavra",
    translation: "Tradução",
    examples: "Exemplos",
    save: "Salvar",
  },
};

export default defineConfig(({ mode }) => ({
  server: {
    allowedHosts: ["fleet-bird-intent.ngrok-free.app"],
  },
  ssr: {
    noExternal: ["@telegram-apps/telegram-ui"],
  },
  define: {
    i18n: i18n[mode === "dev" ? "en" : (mode as keyof typeof i18n)],
  },
  plugins: [tailwindcss(), tanstackStart(), nitro(), react()],
}));
