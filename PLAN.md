# PLAN: Telegram due-word notifications

## Goal

Add proactive Telegram notifications that remind a user when they have words due to learn, with friendly copy that tells them how many words are due today and nudges them to continue.

This PR is planning-only. No application code is included.

## Codebase findings

### Existing Telegram messaging patterns
- `server/src/telegram.ts`
  - Owns the `TelegramBot` instance.
  - Handles inbound commands and callback queries.
  - Already uses `bot.sendMessage(...)`, `sendVoice(...)`, `sendPhoto(...)`, and inline keyboards.
- `server/src/commands/learn.ts`
  - Uses `getRandomWordByUserIDForLearn(...)` from `server/src/repo/words.ts`.
  - Defines the current meaning of “words due to learn”: words whose progress is not `Learned` and whose `Last Revised` is older than the progress-specific spacing.
- `server/src/repo/words.ts`
  - Contains the due-logic primitives today:
    - `getRandomWordByUserIDForLearn(userID, logger)`
    - `getRandomWordByUserIDForRevise(userID, logger)`
    - `ProgressTimeSpace`
  - Does **not** expose a count query for due learn words.
- `server/src/repo/users.ts`
  - Stores Telegram identity (`chatID`, `username`) and small per-user state.
  - No notification preferences, no last-notified timestamps, no opt-out fields.
- `server/src/render/renderTextMsg.ts`
  - Central place for localized text rendering in EN/PT.
  - Best place to add notification copy helpers.

### Existing scheduling / delivery patterns
- There is **no existing scheduler** in the repo.
- There is no cron library, queue, or periodic worker in `server/package.json`.
- Runtime entrypoints are currently:
  - `server/dev.ts --bot` for Telegram polling
  - `server/dev.ts --api` for API server
- There are webhook helper scripts, but no background reminder job.

## Product recommendation

### Initial cadence
**Recommendation: notify at most once every 2 days per user, only when at least 1 word is due.**

### Why this is the right starting point
- The app is a learning tool; reminders help, but over-frequent pings can feel nagging.
- Due words are already spaced by progress bucket (`0 / 1 / 3 / 9 / 27` days). A separate reminder cadence should be simpler and gentler than the spaced-repetition intervals.
- A 2-day cadence is conservative enough to avoid notification fatigue while still catching users who lapse.
- It matches the user’s own suggestion, which is a good default when product certainty is low.

### Zero-due behavior
**Suppress notifications when there are zero words due.**

Rationale:
- “Nothing to do” reminders create noise without clear value.
- The system should only notify when it can point the user to an immediate action.

### Message copy / tone direction
Use copy that is:
- warm and encouraging
- short enough for Telegram push previews
- action-oriented
- factual: include the exact count due today
- non-judgmental if the backlog is large

Example EN direction:
- `You have 5 words due today 📚`
- `A short practice session now will help them stick. Want to do a few?`

Example PT direction:
- `Tem 5 palavras para estudar hoje 📚`
- `Uma sessão curta agora ajuda a fixá-las. Vamos praticar um pouco?`

CTA recommendation:
- include an inline button that deep-links into the existing learn flow / TMA learn screen
- label: `Learn now` / localized equivalent

## Proposed design

### 1) Add notification preference fields to users
Extend `server/src/repo/users.ts` `User` shape with a notification settings block, for example:

```ts
notificationSettings?: {
  dueWordsEnabled: boolean;
  dueWordsCadenceDays: number;
  lastDueWordsNotificationAt?: Date;
}
```

Notes:
- Keep this narrowly scoped to due-word reminders.
- Default for existing and new users:
  - `dueWordsEnabled: true`
  - `dueWordsCadenceDays: 2`
- The worker can implement lazy defaults in code first; a backfill migration is optional, not required for v1.

### 2) Add repository methods for due-word counting and notification eligibility
Add exact repo helpers in `server/src/repo/words.ts` and `server/src/repo/users.ts`.

#### `server/src/repo/words.ts`
Add a count-based query that uses the same due criteria as `getRandomWordByUserIDForLearn(...)`.

Suggested function:

```ts
getDueLearnWordCountByUserID(userID: string, logger: Logger): Promise<number | Error>
```

Implementation notes:
- Reuse the current learn-match criteria so reminder eligibility stays aligned with what `/learn` will actually surface.
- Prefer factoring the Mongo `$match` predicate into a shared helper to avoid duplicating the current due-logic in multiple functions.

#### `server/src/repo/users.ts`
Add helpers such as:

```ts
getUsersEligibleForDueWordNotification(now: Date, logger: Logger): Promise<User[] | Error>
setUserDueWordsNotificationSent(userID: string, sentAt: Date, logger: Logger): Promise<Error | null>
```

Eligibility should require:
- valid `chatID`
- notifications enabled (or missing settings treated as enabled)
- `lastDueWordsNotificationAt` absent, or older than `dueWordsCadenceDays`

This keeps the scheduler query cheap before counting due words per eligible user.

### 3) Add a small notification service
Create a dedicated service, e.g.:
- `server/src/services/dueWordNotifications.ts`

Suggested responsibilities:
- load users eligible by cadence
- compute due learn count per user
- skip users with count `0`
- send Telegram message with inline CTA
- persist `lastDueWordsNotificationAt` **only after successful send**
- log per-user outcomes and summary counters

Suggested public entrypoint:

```ts
runDueWordNotifications(logger: Logger): Promise<void>
```

### 4) Reuse the existing TelegramBot integration cleanly
Avoid embedding scheduler logic inside `server/src/telegram.ts` command handlers.

Preferred approach:
- create a lightweight sender wrapper or instantiate `TelegramBot` in the notification service with the same bot token
- reuse the same TMA learn deep link pattern already used in `server/src/telegram.ts`:

```ts
${process.env.TMA_URL}/learn?chat_id=${chatID}
```

This keeps inbound bot handling and outbound reminder jobs loosely coupled.

### 5) Add localized reminder renderers
Extend `server/src/render/renderTextMsg.ts` with dedicated helpers, e.g.:

```ts
renderDueWordsNotification(wordCount: number): string
renderDueWordsNotificationCta(): string
```

Guidance:
- support singular/plural naturally
- keep MarkdownV2-safe output if formatting is used
- do not overload existing “no more words today” messages

### 6) Add a scheduler entrypoint
Because there is no scheduler today, add a separate job entrypoint rather than mixing with polling or API boot.

Suggested files:
- `server/src/jobs/dueWordNotifications.ts`
- optional script hook in `server/package.json`, for example:
  - `"notify:due-words": "tsx ./src/jobs/dueWordNotifications.ts"`

Execution model for v1:
- run from external cron / platform scheduler once daily
- the job itself enforces per-user cadence (`2` days), so the external schedule can stay simple

Recommended cron frequency:
- once daily at a stable hour in UTC is enough for v1
- if later needed, move to per-user local time windows

## Rollout plan

### Phase 1: server-side reminder MVP
1. Add user notification settings fields/default behavior.
2. Add due-word count query.
3. Add reminder text renderers.
4. Add notification service and one-shot job entrypoint.
5. Add package script and environment docs if needed.
6. Manually dry-run against a test user/chat.

### Phase 2: operationalize
1. Configure deployment scheduler to run daily.
2. Observe logs for send failures, count mismatches, and duplicate sends.
3. Tune cadence only after real usage feedback.

### Phase 3: user controls
Add command or mini-app settings for:
- notification on/off
- cadence selection (`daily`, `every 2 days`, `weekly`)
- optional quiet hours / time-of-day

## Future extension recommendation
The most appropriate next user-configurable extension is:

**Notification preferences per user**
- enabled/disabled toggle
- cadence selector
- preferred reminder time or quiet hours

Why this one first:
- reminders are highly personal
- cadence tolerance varies a lot by user
- it reduces the need for global product guesswork

Good later extensions:
- separate reminders for revise vs learn
- local timezone-aware send windows
- “only notify when due count >= N”
- streak-aware copy variants

## Risks / edge cases
- **Duplicate reminder logic drift** if due-count logic and `/learn` selection logic diverge.
  - Mitigation: extract shared Mongo match builder.
- **Spam risk** if `lastDueWordsNotificationAt` is updated before send success or not checked atomically enough.
  - Mitigation: update timestamp only after successful `sendMessage`.
- **Users without `TMA_URL` configured** cannot receive a useful CTA.
  - Mitigation: fall back to a plain message, or document `TMA_URL` as required for reminder CTA.
- **Large user base** could make per-user counting slow.
  - Mitigation: acceptable for current scale; if needed later, move to aggregation/batched processing.

## Worker implementation notes

### Files to inspect/change
- `server/src/repo/users.ts`
- `server/src/repo/words.ts`
- `server/src/render/renderTextMsg.ts`
- `server/package.json`
- new file(s):
  - `server/src/services/dueWordNotifications.ts`
  - `server/src/jobs/dueWordNotifications.ts`

### Suggested verification
- unit or script-level verification for due count logic across progress buckets
- manual run of reminder job against a test user with:
  - due words > 0 => one reminder sent
  - due words = 0 => no reminder sent
  - reminder already sent within 2 days => no reminder sent
- verify CTA opens existing `/learn` TMA route
- verify EN/PT copy renders correctly and safely in Telegram

## Implementation summary for the worker
Build a new one-shot server job that runs daily, finds users whose due-word reminder window has elapsed, counts how many learn-eligible words they currently have due using the same criteria as `LearnCommand`, sends a friendly Telegram message with that exact count and a `Learn now` deep link, skips users with zero due words, and records the send timestamp only after success. Start with notifications enabled by default and a per-user cadence default of every 2 days.
