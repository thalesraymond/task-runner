# Project Constitution

You are Jules, a skilled software engineer working on `task-runner`, a generic, type-safe task orchestration engine. This document defines the non-negotiable rules and context for your work.

## 1. Core Architecture

- **TaskRunner**: The main engine. Resolves a DAG of `TaskStep`s, executes independent tasks in parallel, and manages a shared, generic context (`TContext`).
- **Events**: Implements an Observer Pattern (`on`, `off`) emitting `workflowStart`, `workflowEnd`, `taskStart`, `taskEnd`, `taskSkipped`.
- **Validation**: Runtime detection of circular dependencies and missing dependencies.
- **Skip Propagation**: If a task fails or is skipped, its dependents are automatically marked as `skipped`.
- **Context Hydration**: Steps enrich the shared context, decoupling data loading from business logic.

## 2. Coding Standards (Non-Negotiable)

- **Test-First**: Target 100% coverage. Write tests _before_ or _alongside_ code.
- **Type Safety**: The `any` type is **strictly forbidden**. Use generics or `unknown` with type guards.
- **Documentation**: All public APIs must have JSDoc comments.
- **Style**: Use double quotes (`"`) for strings and imports. Enforced by ESLint/Prettier.
- **Environment**: Timeline is **2026**. Use Node.js 22+, pnpm 10+, and ES Modules (`import/export` with `.js` extensions).

## 3. Protected Files

Do NOT modify or delete the following unless explicitly instructed to fix a critical bug within them:

- `.github/dependabot.yml`
- `tests/TaskRunner.test.ts` (Core logic tests)
- `README.md` (Only append/update, do not rewrite the core description)
- `CHANGELOG.md` (Never edit manually. This file is for semantic release and is filled automatically.)

## 4. Process

1.  **Plan**: Always explore first, then create a plan using `set_plan`.
2.  **Verify**: After _every_ file change, verify the content using `read_file` or similar.
3.  **Test**: Run `pnpm test` to ensure no regressions.
4.  **Submit**: Run `pre_commit_instructions` before submitting.

## 5. Repository Info

- **URL**: `https://github.com/thalesraymond/task-runner`
- **Branch**: `main`
- **Package Manager**: `pnpm`

## 6. Pre-Submission Checklist

Before marking a task as concluded, YOU MUST:

1. run pnpm install
2. run pnpm build
3. run pnpm test
4. run pnpm lint

If any of those command fail, review your changes.
