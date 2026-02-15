import { Routes, Route } from "react-router-dom";
import { AppRoot } from "@telegram-apps/telegram-ui";

import "@telegram-apps/telegram-ui/dist/styles.css";

import { EditWord } from "./pages/edit_word";
import { AddWord } from "./pages/add_word";
import { Revise } from "./pages/revise";

function App() {
  return (
    <AppRoot className="h-full w-full">
      <Routes>
        <Route path="edit-word" element={<EditWord />} />
        <Route path="add-word" element={<AddWord />} />
        <Route path="revise" element={<Revise />} />
      </Routes>
    </AppRoot>
  );
}

export default App;
