# PLAN.md

## Task
Improve the `client2` add-word UX so that:
- during save, we keep the form visible and prevent duplicate interaction by disabling the form and/or showing a spinner on the submit button
- on save failure, we keep the same form visible and render the error message above the primary CTA instead of replacing the whole page with an error screen

No implementation in this PR. Worker-only follow-up.

## Current behavior

### Entry point
- `client2/src/app/add-word/page.tsx`
  - Reads `chat_id` and Telegram `initData`
  - Uses `useAddWordSubmission()`
  - If `state.status === "error"`, returns a full-page centered red error block
  - If `state.status === "submitted"`, renders the saved word card and follow-up actions
  - Otherwise renders `WordForm`

### Submission state
- `client2/src/app/add-word/hooks/useAddWordSubmission.ts`
  - State union:
    - `{ status: "editing" }`
    - `{ status: "submitted"; word: ... }`
    - `{ status: "error"; error: string }`
  - On submit success: transitions to `submitted`
  - On submit failure: transitions to `error`
  - `useActionState(... )` exposes `isLoading`

### Shared form
- `client2/src/shared/ui/WordForm.tsx`
  - Already accepts `disabled?: boolean`
  - Computes `isFormDisabled = externalDisabled || isGenerating || isSimilarWordChecking || isImagesLoading`
  - Already passes `disabled={isFormDisabled}` to inputs and controls
  - Submit button already supports button spinner via:
    - `loading={externalDisabled && !onDelete}`
    - `disabled={isFormDisabled}`
  - Does **not** currently support rendering a top-of-CTA error message

## Root cause of the UX issue
The add-word page treats save failure as a separate terminal page state (`status: "error"`) and stops rendering `WordForm`. That removes the user’s entered context from the UI and forces a hard visual mode switch. The loading UX is closer to correct already, because `WordForm` disables controls and shows button loading when `disabled` is driven by submit state.

## Proposed implementation

### 1) Keep add-word page on the form after submit failures
Update `client2/src/app/add-word/page.tsx` so that the add flow renders `WordForm` for both:
- `editing`
- `error`

Only keep the separate success UI for `submitted`.

Concretely:
- remove the early return that renders the full-page error block for `state.status === "error"`
- derive an inline error string from submission state and pass it into `WordForm`
- continue passing `disabled={isSubmitting}` so the save action remains non-reentrant

Suggested page-level derivation:
- `const submitError = state.status === "error" ? state.error : undefined`

### 2) Add inline submit-error support to `WordForm`
Update `client2/src/shared/ui/WordForm.tsx` to accept a new prop:
- `submitError?: string`

Render that message in the CTA section, above the Save button, so the user still sees the entire form and can immediately retry.

Suggested placement:
- inside the bottom action container (`div` wrapping Save/Delete buttons)
- before the primary submit button
- styled consistently with existing utility classes, e.g. small red text aligned for form readability

Example shape:
- add to `WordFormProps`
- render only when `submitError` is truthy

### 3) Preserve existing loading behavior; do not add a new page-level loading screen
For the requested loading change, prefer the already-supported simplest path:
- keep the form visible
- disable fields and secondary actions while saving via `disabled={isSubmitting}`
- keep the spinner on the Save button via existing `loading={externalDisabled && !onDelete}` logic

This means the worker likely does **not** need to change loading behavior in `WordForm` unless they find the current `loading` prop is not visually working with the Telegram UI button in this form context.

## Files the worker should touch

### Required
- `client2/src/app/add-word/page.tsx`
  - stop replacing the form with a full-page error state
  - pass inline submit error into `WordForm`

- `client2/src/shared/ui/WordForm.tsx`
  - add `submitError?: string` prop
  - render submit error above the primary CTA

### Likely unchanged
- `client2/src/app/add-word/hooks/useAddWordSubmission.ts`
  - current reducer already captures the server error message and exposes loading state
  - no structural state change appears necessary for the requested UX

## Implementation notes for the worker
- Do **not** implement a second loading indicator if the existing `Button loading` spinner is already visible; the requested “disable form or add spinner if easy” is satisfied by the current form disable + button spinner behavior.
- Keep the success state unchanged (`submitted` should still render the success card and action buttons).
- Keep edit-word behavior unchanged unless intentionally sharing the new `submitError` prop there later.
- Make the new `submitError` prop optional so existing `WordForm` consumers continue compiling without extra changes.

## Verification
From `english_reviser_bot/client2`:
- run `npm run lint`

Manual checks in the add-word flow:
1. Start add-word page and submit valid data.
2. During submit:
   - form remains visible
   - inputs/actions are disabled
   - Save button shows loading spinner (assuming Telegram UI button loading prop renders as expected)
3. Simulate or trigger a save error:
   - form stays mounted
   - previously entered values remain visible
   - error text appears above the Save CTA
   - user can retry after loading ends
4. Successful submit still shows the created word card and follow-up actions.

## Out of scope
- changing API behavior or error payload formats
- redesigning form validation messages
- changing edit-word submission UX
- adding tests unless the worker finds existing test coverage patterns already in place
