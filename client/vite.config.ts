import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const i18n = {
    en: {
        word: 'English',
        translation: 'Translation',
        examples: 'Examples',
        save: 'Save',
    },
    pt: {
        word: 'Palavra',
        translation: 'Tradução',
        examples: 'Exemplos',
        save: 'Salvar'
    }
}

export default defineConfig(({mode}) => ({
  base: './',
  define: {
      i18n: i18n[mode === 'dev' ? 'en' : mode]
  },
  build: {
      outDir: `./dist/${mode}`,
  },
  plugins: [react()],
}))
