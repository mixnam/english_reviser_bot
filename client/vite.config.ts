import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"

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
  server: {
    allowedHosts: [
      "fleet-bird-intent.ngrok-free.app"
    ]
  },
  define: {
      i18n: i18n[mode === 'dev' ? 'en' : mode as keyof typeof i18n]
  },
  build: {
      outDir: `./dist/${mode}`,
  },
  plugins: [
        tailwindcss(),
        react()
  ],
}))

