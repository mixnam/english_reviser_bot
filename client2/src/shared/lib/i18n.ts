export const translations = {
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
    showExample: "Show Example",
    playAudio: "Play Audio",
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
    showExample: "Mostrar Exemplo",
    playAudio: "Tocar Áudio",
  },
};

export type Locale = keyof typeof translations;

export const getI18n = (locale: Locale = "pt") => {
  return translations[locale];
};

// For now, we can use an environment variable or a simple hook to get the current locale.
// In TMA, we might want to detect it from the user's settings.
export const i18n = getI18n((process.env.NEXT_PUBLIC_LOCALE as Locale) || "pt");
