# Implementation Plan: Learn Flow Migration to TMA

This plan outlines the steps to migrate the "learn" flow from direct Telegram bot messages to a dedicated page in the Telegram Mini App (TMA).

## Goals
- Move learn logic to the Controller/Service pattern.
- Implement a dedicated `/learn` page in the client.
- Provide a consistent UX with the `/revise` flow, including congratulations and confetti.

---

## Tasks

### 0. Shared Components Refactoring (Completed)
- [x] **Task 0.1**: Create `client/src/shared/ui` directory.
- [x] **Task 0.2**: Move `WordCard.tsx` from `client/src/pages/revise/ui/` to `client/src/shared/ui/`.
- [x] **Task 0.3**: Move `ReloadIcon.tsx` from `client/src/pages/add_word/ui/` to `client/src/shared/ui/`.
- [x] **Task 0.4**: Update imports in `Revise.tsx` and `AddWord.tsx`.

### 1. Backend Refactoring (Server) (Completed)
- [x] **Task 1.1**: Add `getRandomLearnWord` and `updateLearnWordProgress` to `WordService`.
- [x] **Task 1.2**: Add corresponding handlers to `WordController`.
- [x] **Task 1.3**: Register `GET /chat/:chat_id/word/random-learn` and `POST /chat/:chat_id/word/:word_id/learn-progress` in `wordRoutes.ts`.

### 2. Client-Side Implementation (Completed)
- [x] **Task 2.1**: Update `i18n` in `client/vite.config.ts` with learning-specific strings.
- [x] **Task 2.2**: Create `client/src/pages/learn/api/` hooks for fetching and updating.
- [x] **Task 2.3**: Create `client/src/pages/learn/ui/Learn.tsx` using `WordCard`.
- [x] **Task 2.4**: Register `/learn` route in `client/src/App.tsx`.
- [x] **Task 2.5**: Implement congratulations screen and confetti when no more words are available to learn.

### 3. Telegram Bot Update (Completed)
- [x] **Task 3.1**: Add `renderLearnInTMA` to `server/src/render/renderTextMsg.ts`.
- [x] **Task 3.2**: Update `server/src/commands/learn.ts` to open the TMA `/learn` page.

---

## Verification
- [ ] **Verify**: `/learn` command in Telegram opens the TMA.
- [ ] **Verify**: User can move through learning stages (Up/Down).
- [ ] **Verify**: Congratulations screen appears when done.
