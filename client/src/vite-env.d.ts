/// <reference types="vite/client" />

type I18N = {
  word: string;
  translation: string;
  examples: string;
  save: string;
  doYouRemember: string;
  yes: string;
  no: string;
  reveal: string;
  loading: string;
  noWords: string;
  congrats: string;
  allDone: string;
  close: string;
};

declare const i18n: I18N;

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
