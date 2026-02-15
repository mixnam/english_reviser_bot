import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const i18n = {
  en: {
    word: "English",
    translation: "Translation",
    examples: "Examples",
    save: "Save",
    doYouRemember: "Do you remember this word?",
    yes: "Yes",
    no: "No",
    reveal: "Reveal",
    loading: "Loading...",
    noWords: "No more words to revise!",
  },
  pt: {
    word: "Palavra",
    translation: "Tradução",
    examples: "Exemplos",
    save: "Salvar",
    doYouRemember: "Você se lembra desta palavra?",
    yes: "Sim",
    no: "Não",
    reveal: "Revelar",
    loading: "Carregando...",
    noWords: "Não há mais palavras para revisar!",
  },
};

export default defineConfig(({ mode }) => ({
  base: "./",
  server: {
    allowedHosts: ["fleet-bird-intent.ngrok-free.app"],
  },
  define: {
    i18n: i18n[mode === "dev" ? "pt" : (mode as keyof typeof i18n)],
  },
  build: {
    outDir: `./dist/${mode}`,
  },
  plugins: [tailwindcss(), react()],
}));
