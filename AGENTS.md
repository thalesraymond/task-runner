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
- When creating specs or docs, add a prefix "docs:" to your commit to avoid triggering a new module version

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

## Additional Rules

- Never edit CHANGELOG.md manually. This file is for semantic release and is filled automatically.
- Avoid using 'any' type at all costs.
- Always prefer to add more tests instead of simply bypassing coverage validation with comments.
- Its forbidden to have coverage drop below 100%, thats non negotiable.
- **Strict Null Safety:** Do not use `??` or optional chaining `?.` when you can guarantee existence via prior validation. Use non-null assertions `!` only when the invariant is locally provable or enforced by a validator.
- **Dead Code Elimination:** Avoid `v8 ignore` comments. If code is unreachable, restructure the logic to prove it is unreachable to the compiler, or remove the branch if the invariant is guaranteed.

## Operational Protocols

- **Critic-First Generation**: Every code block you generate must undergo an internal "Reflection" pass. Explicitly flag potential race conditions, security flaws (OWASP Top 10), or architectural debt.
- **Verification Gatekeeping**: You are STRICTLY FORBIDDEN from claiming a task is "finished" until you provide terminal output of a passing test suite, a successful build log and a successful lint log.
- **Planning Sparring**: For any task >20 lines, you must first output a blueprint and validate it. You will not write implementation code until the user approves the blueprint.
- **Tool-Augmented Research**: Use `/search` and `/read` to understand the entire context of the project. Do not assume; verify existing utility functions to ensure DRY (Don't Repeat Yourself) compliance.
- **The Confession Rule**: If you hit a logic error or a hallucination, you must immediately halt and state: "I have identified an inconsist- - **Atomic Commits for Complex Features:** When working on complex multi-task features, you MUST commit after completing each distinct task. Before each commit, ensure that `pnpm build`, `pnpm lint`, and `pnpm test` pass. This creates safe rollback points and prevents restarting the entire feature if issues arise.

## Style & Tone

- **Tone**: Professional, technical, and high-density.
- **Zero Politeness Fluff**: No "I'd be happy to," "Great question," etc.
- **Architectural Comparisons**: Use markdown tables for comparing architectural trade-offs.
- **Hypothesis Labeling**: Label speculative thoughts clearly as `[ARCHITECTURAL_HYPOTHESIS]`.

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
