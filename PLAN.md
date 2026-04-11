# PLAN: add revise-flow due notification mirroring learn notification

## Goal

Add a Telegram notification for the **revise** flow that mirrors the existing **learn** due-word notification:
- same delivery mechanism (Telegram bot message + TMA deep link CTA)
- same scheduling approach (batch job over eligible users)
- same suppression rule when there is nothing due
- parallel localized copy/tone in English and Portuguese
- minimal new configuration unless product needs diverge later

This is a planning-only change. No application code is included in this branch.

## Current state

### Existing learn notification path

The current learn notification is implemented in:
- `server/src/services/dueWordNotifications.ts`
- `server/src/jobs/dueWordNotifications.ts`
- `server/src/repo/users.ts`
- `server/src/repo/words.ts`
- `server/src/render/renderTextMsg.ts`

Current behavior:
- `runDueWordNotifications()` loads users eligible via `getUsersEligibleForDueWordNotification(now, logger)`.
- For each eligible user, it counts due learn words via `getDueLearnWordCountByUserID(user._id, logger)`.
- It **suppresses** the notification when `count <= 0`.
- If count is positive, it sends a Telegram message with CTA deep-linking to `TMA_URL/learn?chat_id=...`.
- After a successful send, it persists `notificationSettings.lastDueWordsNotificationAt`.

### Existing due/review logic

Learn due logic already has a reusable match builder in `server/src/repo/words.ts`:
- `learnEligibilityMatch(userID)`
- `getRandomWordByUserIDForLearn(userID, logger)`
- `getDueLearnWordCountByUserID(userID, logger)`

Revise due logic currently exists only in selection form:
- `getRandomWordByUserIDForRevise(userID, logger)`
- match is inline: `Progress === Learned` and `'Last Revised' < minusDaysFromNow(ProgressTimeSpace[Progress.Learned])`

This means revise already has the core due definition, but it is **not yet factored into a reusable count helper** for notification jobs.

### Existing revise flow / TMA path

Revise entry points:
- Telegram command: `server/src/telegram.ts` (`/revise` -> web_app button to `/revise?chat_id=...`)
- TMA page: `client2/src/app/revise/page.tsx`
- Revise session hook: `client2/src/app/revise/hooks/useReviseSession.ts`
- API endpoints:
  - `GET /chat/:chat_id/word/random-revise`
  - `POST /chat/:chat_id/word/:word_id/progress`

### Existing text / tone patterns

Notification text lives in `server/src/render/renderTextMsg.ts`.
Current learn notification copy:
- EN: `You have {n} words due today 📚\nA short practice session now will help them stick.`
- PT: `Tem {n} palavras para estudar hoje 📚\nUma sessão curta agora ajuda a fixá-las.`
- CTA:
  - EN: `Learn now`
  - PT: `Aprender agora`

## Proposed design

### 1) Mirror learn notification structure for revise

Add a second notification path for revise that matches the learn notification design one-for-one:
- bot-driven outbound message
- same inline keyboard shape
- same TMA deep-linking pattern
- same logging style
- same user-eligibility sweep job pattern
- same zero-count suppression

Expected revise equivalents:
- message body renderer for revise notification
- CTA renderer for revise notification
- `buildReviseUrl(chatID)` -> `${TMA_URL}/revise?chat_id=${chatID}`
- count due revise words before sending
- persist the appropriate “last sent” timestamp only after successful send

### 2) Reuse revise due logic from repo layer instead of duplicating conditions

Refactor `server/src/repo/words.ts` so revise due logic is represented the same way learn due logic is:
- add a reusable `reviseEligibilityMatch(userID)` helper
- update `getRandomWordByUserIDForRevise()` to use that helper
- add `getDueReviseWordCountByUserID(userID, logger)` using the same helper

Why:
- one source of truth for revise due criteria
- notification job and interactive revise flow stay in lockstep
- avoids drift if revise spacing rules change later

### 3) Cadence: match learn by default

Recommendation: **match the existing learn cadence** for v1.

Concretely:
- reuse `notificationSettings.dueWordsCadenceDays`
- do **not** introduce a separate revise cadence setting yet

Why:
- user explicitly wants revise notification to be very similar to learn
- lowest-risk rollout with no settings migration complexity
- keeps operational behavior simple while validating usefulness
- the due content already differs naturally because revise counts are based on learned-word review windows, not learn-stage eligibility

Tradeoff:
- users cannot tune learn/revise reminders independently yet
- if product later wants separate cadences, that can be added after observing behavior

### 4) Persistence strategy

Two acceptable implementation options exist.

#### Preferred option: separate last-sent timestamp for revise

Extend `notificationSettings` in `server/src/repo/users.ts` with:
- `lastReviseWordsNotificationAt?: Date`

And add a revise-specific pair of repo helpers, parallel to learn:
- `getUsersEligibleForReviseWordNotification(now, logger)`
- `setUserReviseWordsNotificationSent(userID, sentAt, logger)`

Why preferred:
- learn and revise notifications do not block each other
- users can receive revise reminders even if they recently got a learn reminder
- keeps semantics explicit and easier to reason about in logs and future settings work

#### Lower-effort option: reuse `lastDueWordsNotificationAt`

Not recommended, because it couples unrelated reminder streams and means a learn notification can suppress a revise notification for the same cadence window (or vice versa).

**Plan decision:** use a separate revise timestamp, while still reusing the same cadence field.

### 5) Copy / tone

The revise copy should mirror the learn copy’s tone:
- short
- encouraging
- lightweight
- action-oriented
- not guilt-inducing

Proposed copy:

#### English
- body: `You have {n} words ready to revise today 📚\nA short review session now will help them stick.`
- CTA: `Revise now`

#### Portuguese
- body: `Tem {n} palavras prontas para revisar hoje 📚\nUma sessão curta de revisão agora ajuda a fixá-las.`
- CTA: `Revisar agora`

This intentionally mirrors learn notification phrasing while changing only the action noun/verb.

### 6) Suppression when there is nothing to revise

Yes — suppress revise notifications when there are zero due revise words.

Implementation rule:
- if `getDueReviseWordCountByUserID(...) <= 0`, skip send and do not update revise last-sent timestamp

This should match the existing learn notification behavior exactly.

## Concrete file plan

### `server/src/repo/words.ts`
Add / refactor:
- `reviseEligibilityMatch(userID)`
- `getDueReviseWordCountByUserID(userID, logger)`
- update `getRandomWordByUserIDForRevise(userID, logger)` to reuse `reviseEligibilityMatch`

### `server/src/repo/users.ts`
Extend `User.notificationSettings` with:
- `lastReviseWordsNotificationAt?: Date`

Add helpers:
- `getUsersEligibleForReviseWordNotification(now, logger)`
- `setUserReviseWordsNotificationSent(userID, sentAt, logger)`

Keep:
- `dueWordsCadenceDays` as the shared cadence control for both learn and revise

### `server/src/render/renderTextMsg.ts`
Add localized renderers:
- `renderReviseWordsNotification(wordCount)`
- `renderReviseWordsNotificationCta()`

### `server/src/services/`
Implementation shape recommendation:
- either create `server/src/services/reviseWordNotifications.ts`
- or generalize `dueWordNotifications.ts` into a flow-parameterized notification sender

Preferred implementation for low-risk worker execution:
- keep current learn file intact
- add sibling file `server/src/services/reviseWordNotifications.ts`

Reason:
- reduces regression risk in existing learn reminders
- keeps PR easy to review
- preserves clear symmetry between learn and revise flows

Expected contents:
- `buildReviseUrl(chatID)`
- `sendReviseWordsNotification(bot, user, wordCount, logger)`
- `runReviseWordNotifications(logger)`

### `server/src/jobs/`
Add:
- `server/src/jobs/reviseWordNotifications.ts`

Pattern should match:
- `server/src/jobs/dueWordNotifications.ts`

### `server/package.json`
Add script:
- `notify:revise-words`: `tsx ./src/jobs/reviseWordNotifications.ts`

### Optional infra follow-up
If deployment cron/workflow currently runs only `notify:due-words`, worker should inspect CI/deploy config to decide whether a second scheduled invocation is required.

Verified repo signal:
- `.github/workflows/deploy-job.yml` deploys a Cloud Run job named `notify-due-words` from `server/src/jobs/**`
- that workflow currently triggers on pushes to `main`, while this repo’s current default branch is `master`

Likely files / systems to verify:
- `.github/workflows/deploy-job.yml`
- any host cron / Cloud Scheduler / external scheduler config not committed in repo

The planning PR should not change infra, but the worker should confirm how reminder jobs are triggered in production and whether revise notifications need a separate deployed job/service/schedule.

## Rollout / implementation steps for worker

1. Add repo-layer revise eligibility/count helpers in `server/src/repo/words.ts`.
2. Add revise notification timestamp and eligibility persistence helpers in `server/src/repo/users.ts`.
3. Add revise notification renderers in `server/src/render/renderTextMsg.ts`.
4. Implement `server/src/services/reviseWordNotifications.ts` mirroring learn notification behavior.
5. Add `server/src/jobs/reviseWordNotifications.ts`.
6. Add `notify:revise-words` script in `server/package.json`.
7. Verify whether scheduled execution must be wired separately from existing learn notification job.
8. Run checks.

## Verification notes

Worker should run at minimum:
- `cd server && npm run check-types`
- if worker edits client text/types for any shared messaging surface, also run relevant client check used by repo conventions
- optional/manual smoke path:
  - seed or identify a user with at least one revise-due word (`Progress = Learned`, stale `Last Revised`)
  - run `npm run notify:revise-words`
  - verify Telegram message body and CTA deep-link to `/revise?chat_id=...`
  - verify no message is sent for users with zero revise-due words
  - verify last revise notification timestamp updates only after success

## Risks / watchouts

- **Cross-stream throttling:** avoid sharing the same last-sent timestamp with learn notifications.
- **Logic drift:** do not duplicate revise due criteria in service code; centralize in repo helper.
- **Scheduler ambiguity:** repo may not contain the final production scheduler; worker must confirm where reminder jobs are invoked.
- **Text mismatch:** keep revise copy intentionally parallel to learn copy so the UX feels like the same notification family.

## Recommended worker implementation summary

Implement a new revise reminder pipeline parallel to the learn reminder pipeline, using the existing Telegram/TMA notification structure, reusing shared cadence, introducing a separate revise last-sent timestamp, and centralizing revise-due counting in `server/src/repo/words.ts`. Do not alter revise session behavior itself beyond the reminder deep link and supporting repo/render/job plumbing.
