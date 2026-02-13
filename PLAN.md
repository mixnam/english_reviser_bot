# Refactoring Plan: Controller/Service Pattern for API

This plan outlines the steps to refactor the monolithic `server/src/api/api.ts` into a more maintainable Controller/Service architecture.

## Goals
- Decouple business logic from Fastify-specific code.
- Improve testability by allowing services to be tested in isolation.
- Reduce the "God Object" nature of the `Api` class.

---

## Tasks

### 1. Define Domain Services (Completed)
Instead of the API calling repositories and external services directly, we will create a domain-specific Service layer.
- [x] **Task 1.1**: Create `server/src/api/services/wordService.ts`.
- [x] **Task 1.2**: Move logic for "similar words search" from `api.ts` to `WordService`.
- [x] **Task 1.3**: Move logic for "saving/editing words" (including word object construction) to `WordService`.
- [x] **Task 1.4**: Orchestrate external calls (OpenAI, Google Search) within `WordService` methods.

### 2. Implement Controllers
Controllers will be responsible for handling the HTTP interface (request validation, status codes, and mapping data to/from Services).
- [ ] **Task 2.1**: Create `server/src/api/controllers/wordController.ts`.
- [ ] **Task 2.2**: Implement methods in `WordController` to handle the current endpoints:
    - `editWord`
    - `getSimilarWords`
    - `generateExample`
    - `searchImages`
    - `saveWord`
- [ ] **Task 2.3**: Move manual request parsing and validation into these controller methods (or separate validation schemas).

### 3. Decouple Routing
Move the route definitions out of the `Api` class into a dedicated routing system.
- [ ] **Task 3.1**: Create `server/src/api/routes/wordRoutes.ts`.
- [ ] **Task 3.2**: Define routes using Fastify's plugin system and map them to `WordController` methods.
- [ ] **Task 3.3**: Define JSON Schemas for each route to replace manual parsing/casting.

### 4. Refactor `Api` Class
The `Api` class should only be responsible for infrastructure.
- [ ] **Task 4.1**: Update `server/src/api/api.ts` to register the new `wordRoutes`.
- [ ] **Task 4.2**: Remove all business logic and manual route handlers from `api.ts`.
- [ ] **Task 4.3**: Clean up constructor-level side effects (like direct `Bot` instantiation) to support better dependency injection.

### 5. Verification
- [ ] **Task 5.1**: Ensure all types and imports are correctly resolved.
- [ ] **Task 5.2**: Verify that the API still correctly interacts with the Telegram Bot and database.
- [ ] **Task 5.3**: Run `npm run check-types` to ensure no regressions in typing.
