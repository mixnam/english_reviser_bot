# Plan: keep add-word flow recoverable on submit failures

## Problem
The client2 add-word screen can drop the editable form into a full-page error state when save/upload fails, leaving no direct retry path and awkward async action handling.

## Intended change
1. Keep the add-word page driven by explicit `editing` and `submitted` states.
2. On submit failures, stay in `editing` and show the error inline inside the form.
3. Keep the success card only for confirmed saves, with reset via “Add new word”.
4. Dispatch the async add-word submit through `startTransition(...)` so the `useActionState` submit flow runs in the expected transition context.

## Files
- `client2/src/app/add-word/hooks/useAddWordSubmission.ts`
- `client2/src/app/add-word/page.tsx`
- `client2/src/shared/ui/WordForm.tsx`

## Verification
- `yarn workspace client2 lint`
- `yarn workspace client2 build`
