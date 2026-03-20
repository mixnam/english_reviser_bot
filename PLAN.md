# Rework Edit-Word Page and Add Word Deletion

## Phase 1: Backend Implementation (Adding Delete Word)
- [x] Add `deleteWord` to repository: `server/src/repo/words.ts`
- [x] Add `deleteWord` to service: `server/src/api/services/wordService.ts`
- [x] Add `deleteWord` to controller: `server/src/api/controllers/wordController.ts`
- [x] Add `DELETE` route: `server/src/api/routes/wordRoutes.ts`

## Phase 2: Frontend Implementation (Edit Word Rework)

### Step 1: Refactor Shared Logic
- [x] Move shared hooks from `client2/src/app/add-word/hooks/` to `client2/src/shared/hooks/`:
    - `useImages.ts`
    - `useExampleGenerator.ts`
    - `useSimilarWordsCheck.ts`
- [x] Create a reusable `WordForm` component in `client2/src/shared/ui/WordForm.tsx`:
    - Define `WordFormData` (zod schema) and type directly inside this file.
    - Combine form layout, image search UI, and example generation UI.
    - Props: `title`, `defaultValues`, `onSubmit`, `onDelete?`, `disabled?`.
    - Only show Delete button if `onDelete` prop is present.

### Step 2: API Updates
- [x] Add `deleteWord` to API client: `client2/src/shared/api/words.ts`.

### Step 3: Submission Logic
- [ ] Update `useAddWordSubmission.ts` to use the new `WordFormData` type from `WordForm.tsx`.
- [ ] Rework submission hook: `client2/src/app/edit-word/hooks/useEditWordSubmission.ts`:
    - Handle image updates:
        - If new image is local -> upload it.
        - If new image is remote -> use its URL.
    - Support `deleteWord` action.

### Step 4: Page Integration
- [ ] Refactor `client2/src/app/add-word/page.tsx` to use the new `WordForm`.
- [ ] Refactor `client2/src/app/edit-word/page.tsx` to use the new `WordForm`:
    - Prefill with existing word data and current image.
    - Pass `onDelete` handler that calls `webApp.showConfirm()` before proceeding.
- [ ] Final validation and testing of both Add and Edit flows.
