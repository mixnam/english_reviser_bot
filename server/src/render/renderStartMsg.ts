interface LanguageTranslations {
  renderStartError: () => string;
  renderStartSuccess: () => string;
}

const languageTokenMap: Record<string, LanguageTranslations> = {
  en: {
    renderStartError: () => `
Sorry, there is some problem 🤕.
Let me figure it out and try to /start one more time later.
`,
    renderStartSuccess: () => `
Hey!
I will help you to study english words everyday!
Here is what can I do:
/revise - Start a revising exercise 
/learn - Start a learning exercise  
/add - I help you to add new word you want to learn
`,
  },
  pt: {
    renderStartError: () => `
Desculpe, há algum problema 🤕.
Deixe-me resolver isso e tente /start mais uma vez mais tarde.
`,
    renderStartSuccess: () => `
Oi!
Vou ajudar você a estudar palavras em inglês todos os dias!
Aqui está o que posso fazer:
/revise - Iniciar um exercício de revisão
/learn - Iniciar um exercício de aprendizado
/add - Eu te ajudo a adicionar uma nova palavra que você deseja aprender
`,
  },
};

const translations = languageTokenMap[process.env.LANGUAGE_CODE?.startsWith('pt') ? 'pt' : 'en'];

const {renderStartError, renderStartSuccess} = translations;

export {
  renderStartError,
  renderStartSuccess,
};
export default translations;
