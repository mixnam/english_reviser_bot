interface LanguageTranslations {
  labelRemember: string;
  labelForgot: string;
  labelUp: string;
  labelDown: string;
  labelYes: string;
  labelNo: string;
  labelStopLearning: string;
  labelStopRevising: string;
  labelRevised: string;
  labelQuestionMark: string;
  labelContinue: string;
}

const languageTokenMap: Record<string, LanguageTranslations> = {
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
