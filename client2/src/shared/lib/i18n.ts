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
		addNewWord: "Add new word",
		editWord: "Edit word",
		generateExample: "Generate example",
		searchImage: "Search Image",
		upload: "Upload",
		deleteWord: "Delete word",
		wordRequired: "Word is required",
		translationRequired: "Translation is required",
		revise: "Revise",
		learn: "Learn",
		retry: "Retry",
		similarWords: "You have some similar words: ",
		deleteConfirm: "Are you sure you want to delete this word?",
		progress: {
			haveProblems: "Have problems",
			payAttention: "Have to pay attention",
			needRepeat: "Need to repeat",
			activeLearning: "Active learning",
			learned: "Learned",
		},
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
		allDone:
			"Você terminou todas as suas palavras para hoje. Ótimo trabalho!",
		allDoneLearn:
			"Você aprendeu todas as suas palavras para hoje. Ótimo trabalho!",
		close: "Fechar",
		showExample: "Mostrar Exemplo",
		playAudio: "Tocar Áudio",
		addNewWord: "Adicionar nova palavra",
		editWord: "Editar palavra",
		generateExample: "Gerar exemplo",
		searchImage: "Buscar Imagem",
		upload: "Upload",
		deleteWord: "Excluir palavra",
		wordRequired: "A palavra é obrigatória",
		translationRequired: "A tradução é obrigatória",
		revise: "Revisar",
		learn: "Aprender",
		retry: "Tentar novamente",
		similarWords: "Você tem algumas palavras semelhantes: ",
		deleteConfirm: "Tem certeza de que deseja excluir esta palavra?",
		progress: {
			haveProblems: "Com problemas",
			payAttention: "Prestar atenção",
			needRepeat: "Precisa repetir",
			activeLearning: "Aprendizado ativo",
			learned: "Aprendido",
		},
	},
};

export type Locale = keyof typeof translations;

export const getI18n = (locale: Locale = "pt") => {
	return translations[locale];
};

// For now, we can use an environment variable or a simple hook to get the current locale.
// In TMA, we might want to detect it from the user's settings.
export const i18n = getI18n((process.env.NEXT_PUBLIC_LOCALE as Locale) || "pt");
