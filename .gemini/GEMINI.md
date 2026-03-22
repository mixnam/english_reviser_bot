## Gemini Added Memories
- Follow the PLAN.md task by task. After finishing each task, mark it as completed in PLAN.md and ask the user for the next command before proceeding.
- If PLAN.md is missing or has no tasks, create it (or add tasks) with detailed descriptions. ALWAYS wait for user confirmation of the plan before starting implementation. Once confirmed, proceed task-by-task, marking each as completed and waiting for the next command before starting the next task.

## Preferred Engineering Workflow
1. **Planning**: Start every major change with a `PLAN.md` file.
2. **Backend Integrity**: Implement business logic in Services/Repos first. Ensure methods are transactional (all-or-nothing) and handle related side effects (e.g., GCS file deletion on DB record deletion).
3. **Decoupling**: Move logic away from legacy wrappers (like bot frameworks) into pure API services.
4. **DRY UI**: Identify shared patterns between pages (like Add vs Edit) and extract reusable components (`WordForm`) and hooks (`useImages`) before final integration.
5. **Localization**: Perform a final pass to centralize all UI strings into the `i18n.ts` system.
