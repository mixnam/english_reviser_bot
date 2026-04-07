# Plan: stop upper Suspense fallback during add-word submit

## Problem
The `client2` add-word flow still shows the app-level `Loading...` fallback during submit. The visible symptom matches a parent `Suspense` boundary taking over instead of keeping the form mounted with only local submit feedback.

## Likely root cause
`client2/src/app/add-word/page.tsx` dispatches the async `useActionState` submit action directly from the `react-hook-form` submit handler:

- `useAddWordSubmission()` is backed by an async `submitReducer` in `client2/src/app/add-word/hooks/useAddWordSubmission.ts`
- `AddWordPageContent.onSubmit(...)` currently calls `submit(...)` directly
- the edit flow in `client2/src/app/edit-word/page.tsx` wraps equivalent `submit(...)` / `remove(...)` dispatches in `startTransition(...)`

Because the add-word action is not started inside a transition, React/Next can surface the nearest parent `Suspense` fallback during the pending async action. In this route tree that can bubble up to the provider-level fallback in `client2/src/app/providers.tsx`, which is the “upper Loading...” the user sees.

## Implementation plan
1. Update `client2/src/app/add-word/page.tsx` to import `startTransition` from React and wrap the add-word `submit(...)` dispatch in `startTransition(() => { ... })`.
2. Keep the existing add-word state machine from `useAddWordSubmission()` unchanged:
   - `editing`
   - inline `error`
   - `submitted`
3. Verify the submit button still shows local loading state via `disabled={isSubmitting}` / `loading={externalDisabled && !onDelete}` in `client2/src/shared/ui/WordForm.tsx`, without replacing the page with the parent `Suspense` fallback.
4. Regression-check that the success card still renders after a successful save and that failed save/upload paths keep the form visible with inline error text.

## Files to touch
- `client2/src/app/add-word/page.tsx`

## Files to inspect while implementing
- `client2/src/app/add-word/hooks/useAddWordSubmission.ts`
- `client2/src/shared/ui/WordForm.tsx`
- `client2/src/app/providers.tsx`
- `client2/src/app/edit-word/page.tsx`

## Verification
- Reproduce on `/add-word` with a normal submit and confirm the provider-level `Loading...` screen no longer appears.
- Confirm the save button shows only button-level pending UI during submit.
- Confirm failed image upload / failed save keeps the form mounted and shows inline error text.
- Confirm successful submit still switches to the success card.
- Run:
  - `yarn workspace client2 lint`
  - `yarn workspace client2 build`
