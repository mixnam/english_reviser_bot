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
    noWordsLearn: "No more words to learn!",
    congrats: "Congratulations!",
    allDone: "You've finished all your words for today. Great job!",
    allDoneLearn: "You've learned all your words for today. Great job!",
    close: "Close",
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
    noWordsLearn: "Não há mais palavras para aprender!",
    congrats: "Parabéns!",
    allDone: "Você terminou todas as suas palavras para hoje. Ótimo trabalho!",
    allDoneLearn: "Você aprendeu todas as suas palavras para hoje. Ótimo trabalho!",
    close: "Fechar",
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
