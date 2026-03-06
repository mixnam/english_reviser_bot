# Migration Plan: client to client2 (Next.js)

## Goals
- Migrate existing React/Vite client to Next.js App Router.
- Maintain existing functionality (Add, Edit, Learn, Revise).
- Preserve styling and Telegram UI integration.
- **Use Next.js native data fetching (Server Components / Fetch / Server Actions) instead of react-query.**
- Use Biome for linting and formatting.

## Tasks

### 1. Setup Base Infrastructure
- [x] **Task 1.1**: Configure environment variables in `client2/.env.local`.
- [x] **Task 1.2**: Install required dependencies in `client2` (`@telegram-apps/telegram-ui`, `@twa-dev/sdk`, `canvas-confetti`).
- [x] **Task 1.3**: Setup `Providers` (Telegram SDK, UI AppRoot) in `client2/src/app/layout.tsx`.
- [x] **Task 1.4**: Port shared UI components to `client2/src/shared/ui`.

### 2. Migrate API Layer
- [x] **Task 2.1**: Port `client/src/config.ts` and replace `react-query` logic with Next.js native `fetch` or Server Actions.
- [x] **Task 2.2**: Port specific page API logic to `client2/src/features/[feature]/api`.

### 3. Migrate Pages (App Router)
- [ ] **Task 3.1**: Migrate `/add_word` to `client2/src/app/add-word/page.tsx`.
- [ ] **Task 3.2**: Migrate `/edit_word` to `client2/src/app/edit-word/page.tsx`.
- [ ] **Task 3.3**: Migrate `/learn` to `client2/src/app/learn/page.tsx`.
- [ ] **Task 3.4**: Migrate `/revise` to `client2/src/app/revise/page.tsx`.
- [ ] **Task 3.5**: Setup root page/redirect in `client2/src/app/page.tsx`.

### 4. Styling and Assets
- [ ] **Task 4.1**: Port Tailwind configuration and global styles.
- [ ] **Task 4.2**: Port assets and public files.

### 5. Verification and Cleanup
- [ ] **Task 5.1**: Verify all flows in TMA environment.
- [ ] **Task 5.2**: Update deployment scripts (if any) to point to `client2`.
