# Refactoring Plan: AddWord Component

## Problem Statement
The current `AddWordForm` component is a "Mega-Component" that manages too many responsibilities:
- Form state for 3+ fields.
- File processing and preview logic.
- Three distinct API flows (Similar words, Generate example, Image search).
- Complexity of 14+ `useState` calls and many manual callbacks.
- Mixing business logic with UI structure.

## Goals
- **Modularity**: Extract business logic into specialized custom hooks.
- **Declarative Form Management**: Use `react-hook-form` and `Zod` for state and validation.
- **Maintainability**: Reduce the number of `useState` calls in the main component.
- **Reusability**: Ensure logic (like image searching) can be easily used in the `EditWord` page.

## Architecture

### 1. Data Layer (`Zod` + `react-hook-form`)
- Define a strict `AddWordSchema` for the form data.
- Use `useForm` to manage the core fields (`word`, `translation`, `example`).
- Remove manual `onChange` handlers for these fields.

### 2. Logic Layer (Custom Hooks)
- **`useSimilarWords(word: string)`**: Handles the debounced check against the database.
- **`useImageGallery(word: string, translation: string)`**: Manages the remote image search, offset, and selection.
- **`useFilePicker()`**: Handles local file selection, clipboard pasting, and generating base64 previews.
- **`useAddWordSubmission()`**: Orchestrates the multi-step submission (Upload image if needed -> Save word).

### 3. Utility Layer (`shared/lib`)
- **`debounce`**: Move to a shared utility file.
- **`fileToDataUrl`**: A helper for processing local files.

### 4. UI Layer (`AddWordPage`)
- Keep the UI "flat" in the main component as requested.
- Bind the UI to the hooks.
- Use `Suspense` for the loading states.

## Implementation Steps

1. **Task 1: Infrastructure**
   - Install `react-hook-form`, `zod`, and `@hookform/resolvers`.
   - Create `client2/src/shared/lib/utils.ts`.

2. **Task 2: Schema & Types**
   - Create `client2/src/app/add-word/schema.ts`.

3. **Task 3: Custom Hooks**
   - Implement `useSimilarWords`.
   - Implement `useImageGallery`.
   - Implement `useFilePicker`.

4. **Task 4: Component Refactor**
   - Rewrite `AddWordPage` using `react-hook-form`.
   - Wire the new hooks into the UI.

5. **Task 5: Verification**
   - Ensure all features (similar words, example generation, image search, upload, submit) work correctly.
