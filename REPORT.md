# Project Review Report: notion-revise-words (Server)

## Overview
The `server/` project is a TypeScript-based backend for a Telegram bot designed to help users learn and revise words. It integrates with a Telegram Mini App (TMA), MongoDB, and several external services (Google Cloud, OpenAI).

## Core Technologies
- **Language**: TypeScript
- **Frameworks**: Fastify (API), node-telegram-bot-api (Bot)
- **Database**: MongoDB
- **External Services**:
  - **Google Cloud Storage**: For storing audio and images.
  - **Google Cloud Text-to-Speech**: For generating word pronunciation.
  - **OpenAI**: For generating example sentences and translations.
- **Logging**: Pino
- **Runtime**: Node.js (with `tsx` for development)

---

## Architectural Deep Dive

### 1. Bot & API Dual Entry Points
The project runs both a Telegram bot and a Fastify API.
- The **Bot** (`src/telegram.ts`) handles direct user interactions via commands and callbacks.
- The **API** (`src/api/api.ts`) serves the Telegram Mini App, allowing for more complex UI (like adding or editing words) while maintaining communication with the bot (e.g., sending messages back to the user).

### 2. State Machine for Complex Flows
The project uses a structured "Flow" system (`src/flows/`) to handle multi-step interactions (e.g., `AddNewWordFlow`). This approach is superior to scattered conditional logic as it:
- Clearly defines states and transitions.
- Separates action logic (what the bot does) from transition logic (how it reacts to input).

### 3. Repository Pattern
Data access is abstracted into repositories (`src/repo/`).
- `words.ts`: Handles word CRUD, progress tracking, and random selection for revision/learning.
- `users.ts`: Handles user profiles and session states.
- Uses an `executionTime` wrapper for performance monitoring.

### 4. Service Abstraction
External integrations are encapsulated in services (`src/services/`, `src/tts/`).
- Implementations use a singleton-like pattern (labeled as tech debt by the author).
- Media handling is efficient: it caches Telegram file IDs to avoid re-uploading the same content multiple times.

---

## Best Practice Estimation

### Strengths
- **Security**: API endpoints are protected by verifying `telegram-init-data`.
- **Separation of Concerns**: Excellent modularity. Commands, flows, repositories, and services are clearly decoupled.
- **Observability**: Consistent use of Pino logger with child loggers for context.
- **Performance**: Resource IDs are cached; database queries are wrapped for timing.
- **Consistency**: The codebase follows a uniform style and pattern throughout.

### Areas for Improvement (Tech Debt)
- **Dependency Injection**: The project heavily relies on singletons and global instances. Moving to a proper DI container (or even simple constructor injection) would improve testability.
- **Testing**: There is a notable absence of unit or integration tests. Adding tests for repositories and flow transitions should be a priority.
- **Error Handling**: The pattern of returning `Error | T` is used consistently but can be cumbersome compared to `Result` types or standard try-catch patterns in some contexts.
- **Hardcoding**: Some prompts and model names (e.g., `gpt-4.1-nano`) are hardcoded. Moving these to environment variables or a configuration service would increase flexibility.
- **OpenAI Service**: The OpenAI service uses non-standard method calls (`client.responses.create`) which might be specific to a certain proxy or a very specific version of an SDK, making it less portable.

---

## API Specific Bad Practices

### 1. Misleading Async Signatures
The `verifyTelegramWebAppData` function in `src/api/verify.ts` is declared as `async` but contains only synchronous `crypto` and string operations. This can lead to unnecessary overhead or confusion for developers calling the function.

### 2. Lack of Request Validation
The API endpoints in `src/api/api.ts` do not use Fastify's built-in JSON Schema validation. Instead, they rely on:
- Manual type casting (e.g., `Number.parseInt(req.params.chat_id)`).
- Manual JSON parsing (e.g., `JSON.parse(req.body)`).
- Implicit trust in the structure of `req.body`.
This makes the API fragile and prone to runtime errors if the client sends unexpected data.

### 3. Inconsistent Error Responses
Error handling often returns a generic `500` status code without an informative response body (e.g., `res.code(500).send();`). This makes debugging difficult for frontend developers or external consumers.

### 4. Security Risks in Dev Mode
The authentication hook is completely bypassed if `process.env.DEV` is truthy. While common for local development, relying on a generic environment variable name like `DEV` can be dangerous if it's accidentally set in a staging or production environment.

### 5. Hardcoding
Several values are hardcoded instead of being configurable via environment variables:
- **Port**: The server is locked to port `3000` in `start()`.
- **Search Queries**: The `image/search` endpoint appends a hardcoded string `" ilustração"` to every query, which is language-specific and should be configurable.
- **Limits**: The number of search results (`num: '5'`) and SafeSearch settings are hardcoded in `GoogleImageService`.

### 6. Dependency on External Singleton State
The API creates a `new Bot()` instance in its constructor. Since the `Bot` also initializes its own services and listeners, this can lead to side effects and makes it impossible to share a single bot instance if the application were to scale or be refactored into a more traditional DI pattern.

### 7. Monolithic API Structure
Currently, `api.ts` acts as a "God Object." It handles server configuration, routing, and business logic all in one place.
- **Problem**: This violates the Single Responsibility Principle and makes the codebase difficult to scale or test.
- **Impact**: Logic for saving words or searching images cannot be reused outside of the HTTP context without duplication.
- **Recommendation**: Implement a Controller/Service pattern to decouple the API framework (Fastify) from the application's core logic.

---

## Conclusion
The `server/` project is a solid, well-engineered application. It shows a high level of proficiency in building Telegram-based applications. The architectural choices (especially the state machine for flows) make it maintainable and extensible. The primary next step for maturing this codebase would be the introduction of an automated testing suite and refactoring towards dependency injection.

**Overall Rating: B+** (Great structure and logic, penalized for lack of tests and DI).
