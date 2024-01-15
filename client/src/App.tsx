import {Routes, Route} from 'react-router-dom'
import {AppRoot} from '@telegram-apps/telegram-ui'
import './App.css'

import '@telegram-apps/telegram-ui/dist/styles.css'

import { EditWord } from './pages/edit_word'

function App() {
  return (
    <AppRoot>
      <Routes>
        <Route path='edit-word' element={<EditWord />} />
      </Routes>
    </AppRoot>
  )
}

export default App
