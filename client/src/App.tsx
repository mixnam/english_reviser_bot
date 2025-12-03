import {Routes, Route} from 'react-router-dom'
import {AppRoot} from '@telegram-apps/telegram-ui'

import '@telegram-apps/telegram-ui/dist/styles.css'

import { EditWord } from './pages/edit_word'
import { AddWord } from './pages/add_word'

function App() {
  return (
    <AppRoot>
      <Routes>
        <Route path='edit-word' element={<EditWord />} />
        <Route path='add-word' element={<AddWord />} />
      </Routes>
    </AppRoot>
  )
}

export default App
