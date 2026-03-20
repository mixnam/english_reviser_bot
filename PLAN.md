# Rework Edit-Word Page and Add Word Deletion

## Phase 1: Backend Implementation & Refactoring
- [x] Add `deleteWord` to repository: `server/src/repo/words.ts`
- [x] Add `deleteWord` to service: `server/src/api/services/wordService.ts`
- [x] Add `deleteWord` to controller: `server/src/api/controllers/wordController.ts`
- [x] Add `DELETE` route: `server/src/api/routes/wordRoutes.ts`
- [ ] **Refactor `saveWord` and `editWord` for immediate response**:
    - [ ] Update `WordService.saveWord` to save to DB immediately and return status.
    - [ ] Update `WordService.editWord` to save to DB immediately and return status.
    - [ ] Move Bot notifications/updates to background tasks (non-blocking).

## Phase 2: Frontend Implementation (Edit Word Rework)

### Step 1: Refactor Shared Logic
- [x] Move shared hooks from `client2/src/app/add-word/hooks/` to `client2/src/shared/hooks/`.
- [x] Create a reusable `WordForm` component in `client2/src/shared/ui/WordForm.tsx`.

### Step 2: API Updates
- [x] Add `deleteWord` to API client: `client2/src/shared/api/words.ts`.

### Step 3: Submission Logic
- [x] Update `useAddWordSubmission.ts` to use the new `WordFormData` type from `WordForm.tsx`.
- [x] Rework submission hook: `client2/src/app/edit-word/hooks/useEditWordSubmission.ts`.

### Step 4: Page Integration
- [x] Refactor `client2/src/app/add-word/page.tsx` to use the new `WordForm`.
- [x] Refactor `client2/src/app/edit-word/page.tsx` to use the new `WordForm`.
- [x] Final validation and testing.
