/**
 * @typedef {Object} LanguageTranslations
 * @property {() => string} renderHelpMsg - Translation for the help message.
 */

/**
 * @type {Object.<string, LanguageTranslations>}
 */
const languageTokenMap = {
  en: {
    renderHelpMsg: () => `
This bot can help you learn and review English words\\.

First, you can add a new word using the /add command\\.

Then, with the /learn command, once a day, you should try to remember the word's translations\\. If you remember it, press 'Up'; if not, press 'Down'\\. The word is considered learned once it has gone through all the stages from bottom to top:
    
    *Learned 🟢*
    *Active Learning 🔵*
    *Need to repeat 🟡*
    *Have to pay attention 🟠*
    *Have problems 🔴*
    
Afterward, you can revise and check your learned words using the /revise command\\. If you don't remember a word, you can mark it as forgotten, and it will return to the very bottom stage of learning\\.
`,
  },
  pt: {
    renderHelpMsg: () => `
Este bot pode ajudá\\-lo a aprender e revisar palavras em inglês\\.

Primeiro, você pode adicionar uma nova palavra usando o comando /add\\.

Em seguida, com o comando /learn, uma vez por dia, você deve tentar lembrar as traduções da palavra\\. Se você se lembrar, pressione 'Para cima'; se não, pressione 'Para baixo'\\. A palavra é considerada aprendida quando passa por todas as etapas de baixo para cima:
    
    *Aprendido 🟢*
    *Aprendizado Ativo 🔵*
    *Necessita Repetição 🟡*
    *Precisa Prestar Atenção 🟠*
    *Apresenta Problemas 🔴*
    
Depois, você pode revisar e verificar suas palavras aprendidas usando o comando /revise\\. Se você não se lembrar de uma palavra, pode marcá\\-la como esquecida, e ela retornará à etapa mais inferior de aprendizado\\.
`,
  },
};

/**
 * @type {LanguageTranslations}
 */
const translations = languageTokenMap[process.env.LANGUAGE_CODE?.startsWith('pt') ? 'pt' : 'en'];

module.exports = translations;
