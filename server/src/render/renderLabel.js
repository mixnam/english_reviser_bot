/**
 * @typedef {Object} LanguageTranslations
 * @property {string} labelRemember - Translation for the 'Remember' label.
 * @property {string} labelForgot - Translation for the 'Forgot' label.
 * @property {string} labelUp - Translation for the 'Up' label.
 * @property {string} labelDown - Translation for the 'Down' label.
 * @property {string} labelYes - Translation for the 'Yes' label.
 * @property {string} labelNo - Translation for the 'No' label.
 * @property {string} labelStopLearning - Translation for the 'Stop learning' label.
 * @property {string} labelStopRevising - Translation for the 'Stop revising' label.
 * @property {string} labelRevised - Translation for the 'Revised' label.
 * @property {string} labelQuestionMark - Translation for the 'Question Mark' label.
 * @property {string} labelContinue - Translation for the 'Continue' label.
 */

/**
 * @type {Object.<string, LanguageTranslations>}
 */
const languageTokenMap = {
  en: {
    labelRemember: 'Remember ✅',
    labelForgot: 'Forgot ❌',
    labelUp: 'Up',
    labelDown: 'Down',
    labelYes: 'Yes',
    labelNo: 'No',
    labelStopLearning: 'Stop learning',
    labelStopRevising: 'Stop revising',
    labelRevised: '*Revised ✅*',
    labelQuestionMark: '❓',
    labelContinue: 'Continue',
  },
  pt: {
    labelRemember: 'Lembrar ✅',
    labelForgot: 'Esquecer ❌',
    labelUp: 'Para cima',
    labelDown: 'Para baixo',
    labelYes: 'Sim',
    labelNo: 'Não',
    labelStopLearning: 'Parar de aprender',
    labelStopRevising: 'Parar de revisar',
    labelRevised: '*Revisado ✅*',
    labelQuestionMark: '❓',
    labelContinue: 'Continuar',
  },
};

/**
 * @type {LanguageTranslations}
 */
const translations = languageTokenMap[process.env.LANGUAGE_CODE?.startsWith('pt') ? 'pt' : 'en'];

const {
  labelRemember,
  labelForgot,
  labelUp,
  labelDown,
  labelYes,
  labelNo,
  labelStopLearning,
  labelStopRevising,
  labelRevised,
  labelQuestionMark,
  labelContinue,
} = translations;

export {
  labelRemember,
  labelForgot,
  labelUp,
  labelDown,
  labelYes,
  labelNo,
  labelStopLearning,
  labelStopRevising,
  labelRevised,
  labelQuestionMark,
  labelContinue,
};

export default translations;
