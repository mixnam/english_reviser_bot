import { Routes, Route } from "react-router-dom";
import { AppRoot } from "@telegram-apps/telegram-ui";

import "@telegram-apps/telegram-ui/dist/styles.css";

import { EditWord } from "./pages/edit_word";
import { AddWord } from "./pages/add_word";
import { Revise } from "./pages/revise";
import { Learn } from "./pages/learn";

function App() {
  return (
    <AppRoot className="h-full w-full">
      <Routes>
        <Route path="edit-word" element={<EditWord />} />
        <Route path="add-word" element={<AddWord />} />
        <Route path="revise" element={<Revise />} />
        <Route path="learn" element={<Learn />} />
      </Routes>
    </AppRoot>
  );
}

export default App;
