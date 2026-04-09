# Plan: learning-session completion progress summary

## Goal
Show a richer study-progress summary on the final **Learn** screen after a session completes, instead of only the existing congratulation placeholder.

The completion screen should:
- show the number of words covered in the just-finished learning session
- show bucket-by-bucket progress, similar to `/stats`, but with clearer in-app UI
- animate the transition from the user state **before** the learning session to the state **after** the learning session
- handle empty / unchanged states gracefully

## Current codebase findings

### Learning completion flow
- `client2/src/app/learn/page.tsx`
  - Renders the current learn UI.
  - When `!isLoading && !word`, it shows a `Placeholder` with confetti and a Close button.
  - There is no session summary state, no session word count, and no stats fetch.
- `client2/src/app/learn/hooks/useLearnSession.ts`
  - Uses `useActionState` to drive the learn flow.
  - Supports three reducer actions: `init`, `reveal_word`, `mark_word`.
  - After `mark_word`, it updates progress and immediately fetches the next learn word.
  - When no more words are available, reducer returns `{ type: "no_words" }`.
  - The hook currently loses all per-session context except the current word.

### Existing stats logic
- `server/src/commands/stats.ts`
  - `/stats` gets aggregated counts via `getWordsStats(user._id, logger)` and renders a Telegram markdown message.
- `server/src/render/renderWord.ts`
  - `renderWordsStats(stats)` computes:
    - total word count
    - per-bucket counts and percentages
    - a weighted overall progress percentage using `ProgressOrder`
  - This is useful as the source-of-truth for the progress model, but the presentation is Telegram-markdown-oriented.
- `server/src/repo/words.ts`
  - `getWordsStats(userID, logger)` groups by `Progress` and returns counts.
  - `ProgressOrder` and progress labels live here.

### Learning progress model
- `server/src/repo/words.ts`
  - Progress buckets:
    - `Have problems`
    - `Have to pay attention`
    - `Need to repeat`
    - `Active learning`
    - `Learned`
  - `updateLearnWordProgress` in `server/src/api/services/wordService.ts` moves a word one step up/down in `ProgressOrder`.
  - Due learn words are selected with `learnEligibilityMatch(userID)` and `getRandomWordByUserIDForLearn(...)`.

### Existing UI / animation patterns
- `client2/src/shared/ui/WordCard.tsx`
  - Uses simple Tailwind transitions (`transition-all`, `duration-500`, `ease-in-out`) for reveal states.
- `client2/src/shared/ui/ImagePreview.tsx` (via grep)
  - Uses utility classes like `animate-in`, `fade-in`, `zoom-in-95`.
- `client2/package.json`
  - No dedicated animation library is installed.
  - Recommend staying with CSS/Tailwind transitions instead of introducing a new dependency.

## Proposed product behavior

### When the summary appears
- Only on the **Learn** flow final screen (`client2/src/app/learn/page.tsx`), after the session runs out of due learn words.
- Replace the current bare completion placeholder with a composed summary card + close CTA.
- Keep confetti on first transition into the completed state.

### What the summary shows
1. **Session word count**
   - Count of words answered in the just-finished learn session.
   - Copy example: `You studied 12 words this session`.
2. **Bucket-by-bucket progress**
   - Five rows, one per progress bucket.
   - Each row should show:
     - bucket label
     - after-session count
     - share of total words (optional subtitle / small text)
     - a visual horizontal bar
     - animated delta from before -> after
3. **Overall progress**
   - Weighted progress percentage, reusing the same weighting concept as `/stats`.
   - Render as a prominent progress bar / pill instead of emoji blocks.
4. **Before vs after change cues**
   - Each bucket row should visually encode whether it increased, decreased, or stayed the same.
   - Example: subtle `+2` or `-1` badge beside the final count.

## Data design

### New summary payload shape
Add a summary DTO shared by server and client, for example:

```ts
export type ProgressBucketKey =
  | "Have problems"
  | "Have to pay attention"
  | "Need to repeat"
  | "Active learning"
  | "Learned";

export type ProgressStats = Record<ProgressBucketKey, number>;

export type LearnSessionSummary = {
  sessionWordCount: number;
  before: ProgressStats;
  after: ProgressStats;
  totalWords: number;
  dueWordsBeforeSession: number;
  dueWordsAfterSession: number;
  weightedProgressBefore: number;
  weightedProgressAfter: number;
  changed: boolean;
};
```

Notes:
- `before` and `after` should be normalized to include **all five** buckets, even when count is zero.
- `changed` is derived as any bucket delta or weighted progress delta.
- `sessionWordCount` is the number of answered words, not the total due count.

## How to source pre-learning and post-learning states

### Recommended source of truth
Capture a **session snapshot** at the start of the Learn web session, then compute the final state when the session ends.

### Client session state
Extend `useLearnSession` state so it persists:
- `sessionWordCount`
- `initialStats` (pre-learning / before state)
- `completionSummary` (filled once the session ends)
- possibly `hasFiredCompletionConfetti`

### Server API additions
Add a dedicated endpoint to fetch learn summary stats, e.g.:
- `GET /chat/:chat_id/word/learn-summary`

Response options:
1. **Preferred:** server returns normalized stats + weighted progress in one response.
2. **Fallback:** server returns raw stats only and client computes weights.

Recommended server response:
- current normalized `stats`
- `dueLearnCount`
- `totalWords`
- `weightedProgress`

### Flow
1. On learn session init:
   - fetch first learn word as today
   - also fetch `before` summary snapshot once
2. On each answer:
   - increment local `sessionWordCount`
3. When `mark_word` fetches no next word:
   - fetch summary snapshot again as `after`
   - build `completionSummary`
   - transition reducer to a dedicated `completed` state instead of generic `no_words`

### Why this approach
- Avoids reconstructing the initial state from event history.
- Keeps server stat logic authoritative.
- Makes the final screen deterministic even if multiple words changed buckets during the session.

## State-management changes

### `useLearnSession` reducer changes
Current reducer states should evolve to something like:

```ts
type State =
  | { type: "init" }
  | { type: "active"; word: Word; revealed: boolean; sessionWordCount: number; before: LearnStatsSnapshot | null }
  | { type: "completed"; summary: LearnSessionSummary }
  | { type: "empty"; before: LearnStatsSnapshot | null }
  | { type: "error"; message?: string };
```

Recommended behavior:
- `init`: fetch first word + before snapshot
- `active`: normal learning state
- `completed`: no next word and sessionWordCount > 0, show summary
- `empty`: no due words on first load, keep the current simple no-words UX (or a reduced summary-free completion state)

Important guardrail:
- Distinguish **"user had no due words when opening Learn"** from **"user completed a session"**.

## UI design recommendation

### New componentization
Add a dedicated presentational component such as:
- `client2/src/app/learn/components/LearnCompletionSummary.tsx`

Potential supporting pieces:
- `ProgressBucketRow.tsx`
- `ProgressDeltaBar.tsx`
- `learnSummary.ts` utilities for percentages, normalized order, and deltas

### Layout recommendation
Use a vertically stacked card layout:
1. celebratory header
2. session count chip
3. overall progress card
4. per-bucket list
5. close button

### Bucket-by-bucket rendering: clearer than `/stats`
For each bucket row, render:
- left: colored dot + localized bucket title
- center/right: final count and small delta badge
- below: horizontal track
  - faint background track = full scale by total word count
  - animated fill to the **after** count percentage
  - ghost/underlay marker or thin segment representing **before** count

Recommended visual language:
- `before` = muted track / lighter fill / dashed marker
- `after` = saturated fill
- delta = text badge (`+3`, `-1`, `0`) with green/red/neutral styling

This is clearer than `/stats` because users can immediately see:
- final distribution
- exact change
- movement across buckets
without parsing markdown percentages and emoji bars.

## Animation recommendation

### Recommendation: staged CSS animation, no new dependency
Use CSS/Tailwind transitions and a small mount-time animation sequence.

### Suggested animation sequence
1. Completion state mounts.
2. Count chip fades/slides in.
3. Overall progress animates from `weightedProgressBefore` to `weightedProgressAfter`.
4. Bucket rows animate one by one (staggered 60–100ms):
   - number tween or fade swap from before -> after
   - bar width transition from before percentage -> after percentage
   - delta badge pops in

### Implementation approach
- Use local component state like `animateToAfter` toggled in `useEffect(() => setTimeout(...))`.
- Render bar width with inline style percentages and CSS `transition: width 600ms ease`.
- For count transitions, either:
  - keep it simple: fade from before count to after count, or
  - implement a tiny `requestAnimationFrame` number tween utility if desired.

### Why this recommendation
- Fits existing codebase patterns.
- No animation-library install, no bundle cost, no new motion primitives to standardize.
- Easy for worker to deliver reliably inside Telegram Mini App constraints.

## API / server plan

### Add normalized stats service
Add a reusable service/helper on the server to compute normalized progress stats for a user.

Candidate locations:
- `server/src/repo/words.ts`
  - add normalized stats helper alongside `getWordsStats`
- and/or `server/src/api/services/wordService.ts`
  - compose repo result into API DTO

Recommended additions:
- `getNormalizedWordsStats(userID, logger)`
- `getWeightedProgress(stats)` shared helper
- `getLearnSummary(chatID)` on `WordService`

### Add learn summary route/controller
Files likely touched by worker:
- `server/src/api/routes/wordRoutes.ts`
- `server/src/api/controllers/wordController.ts`
- `server/src/api/services/wordService.ts`
- `server/src/repo/words.ts`

## Client API / typing plan

Files likely touched by worker:
- `client2/src/shared/api/types.ts`
  - add summary schema(s)
- `client2/src/shared/api/words.ts`
  - add `getLearnSummary(...)`
- `client2/src/shared/lib/i18n.ts`
  - add summary labels / bucket labels / delta copy if needed

## Learn page implementation plan

Files likely touched by worker:
- `client2/src/app/learn/hooks/useLearnSession.ts`
- `client2/src/app/learn/page.tsx`
- new `client2/src/app/learn/components/LearnCompletionSummary.tsx`
- optional new `client2/src/app/learn/lib/summary.ts`
- optional `client2/src/app/globals.css` only if utility classes are not sufficient

### Detailed implementation steps
1. Add server summary endpoint and DTO.
2. Add client API/types for summary fetch.
3. Refactor `useLearnSession` to retain:
   - pre-session summary snapshot
   - per-session answered count
   - completion summary
4. Introduce a distinct completed state.
5. Replace current completion placeholder in `learn/page.tsx` with summary component when completed state exists.
6. Keep legacy simple empty-state UI for zero due words on initial load.
7. Add localized copy strings.
8. Run client/server checks.

## Guardrails and edge cases

### No due words at session start
If the user opens Learn and there are no due words immediately:
- do **not** show a fake “you studied 0 words” animated transition
- keep current lightweight completion / empty state
- optional: show current overall stats without animation only if desired, but not required for first pass

### State unchanged
Possible when:
- session summary fetch fails and fallback data matches before snapshot
- a word was already at the edge bucket and the answer did not move it
- multiple answers net to zero for some buckets

Behavior:
- still show summary if `sessionWordCount > 0`
- animate minimally
- use neutral copy like `No bucket changes this session` only when all deltas are zero
- do not force misleading positive delta visuals

### Partial failures
If final summary fetch fails after session completion:
- fall back to current congratulation placeholder plus session word count if available
- do not block session completion
- log error but keep close CTA usable

### Zero total words
Unlikely for active users, but if total count is zero:
- avoid division-by-zero in percentages and weighted progress
- render empty bars and hide percentages

## Verification notes for worker
- Learn flow with due words available:
  - answer several words and verify session word count increments
  - ensure final screen shows before/after stats
- Learn flow with no due words from the start:
  - ensure empty-state path still works
- Boundary bucket cases:
  - answering “No” on `Have problems` stays at floor
  - answering “Yes” on `Learned` should never happen in learn flow, but summary math must still be safe
- Visual checks:
  - bars animate once on completion
  - confetti still fires only on completion
  - close button still closes TMA
- Suggested checks:
  - `cd client2 && npm run check`
  - `cd server && npm test` or project-equivalent validation if available

## Worker implementation summary
Build a learn-session completion summary screen for the Mini App by adding a server summary endpoint, extending the learn hook to capture `before` and `after` progress snapshots plus `sessionWordCount`, and rendering a new animated completion component that shows total studied words, overall weighted progress, and bucket-by-bucket bars/deltas. Preserve the existing simple empty-state path when the user had no due words at session start.
