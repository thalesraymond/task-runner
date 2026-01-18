<!-- OPENSPEC:START -->

# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:

- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:

- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

## Additional Rules

- Never edit CHANGELOG.md manually. This file is for semantic release and is filled automatically.
- Avoid using 'any' type at all costs.
- Always prefer to add more tests instead of simply bypassing coverage validation with comments.
- Its forbidden to have coverage drop below 100%, thats non negotiable.

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

- **Atomic Commits for Complex Features:** When working on complex multi-task features, you MUST commit after completing each distinct task. Before each commit, ensure that `pnpm build`, `pnpm lint`, and `pnpm test` pass. This creates safe rollback points and prevents restarting the entire feature if issues arise.
- Never edit CHANGELOG.md manually. This file is for semantic release and is filled automatically.

Before marking a task as concluded, YOU MUST:

1. run pnpm install
2. run pnpm build
3. run pnpm test
4. run pnpm lint

If any of those command fail, review your changes.

<!-- MANUAL ADDITIONS END -->
