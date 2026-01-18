# task-runner Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-01-17

## Active Technologies
- TypeScript 5.9.3 + vitest 4.0.17 (for testing) (004-pre-execution-validation)
- TypeScript 5.9.3 + vitest 4.0.17, AbortSignal/AbortController (standard Web APIs) (002-task-cancellation)
- N/A (in-memory context object) (002-task-cancellation)
- N/A (in-memory queue for tasks) (005-concurrency-control)

- TypeScript 5.9.3 + vitest 4.0.17 (003-refactor-file-structure)

- (001-generic-task-runner)

## Project Structure

```text
src/
tests/
```

## Commands

# Add commands for

## Code Style

: Follow standard conventions

## Recent Changes
- 005-concurrency-control: Added TypeScript 5.9.3 + vitest 4.0.17
- 002-task-cancellation: Added TypeScript 5.9.3 + vitest 4.0.17, AbortSignal/AbortController (standard Web APIs)
- 004-pre-execution-validation: Added TypeScript 5.9.3 + vitest 4.0.17 (for testing)



<!-- MANUAL ADDITIONS START -->
Before marking a task as concluded, YOU MUST:

1. run pnpm install
2. run pnpm build
3. run pnpm test
4. run pnpm lint

If any of those command fail, review your changes.
<!-- MANUAL ADDITIONS END -->
