## Context

The task-runner project is currently organized with two main implementations (`ts/` and `go/`). Currently, the Husky git hooks and the commit helper (such as commitizen/commitlint) are setup only within the `ts/` directory. This requires developers to execute their git commits from within the `ts/` folder to trigger these helpers, which is cumbersome and easy to forget, leading to poorly formatted commit messages.

## Goals / Non-Goals

**Goals:**
- Move Husky configuration to the repository root.
- Move commit-related development dependencies to a root `package.json`.
- Ensure git hooks (like `pre-commit` or `commit-msg`) execute properly from the root of the project.

**Non-Goals:**
- We are not changing the structure of the `ts/` or `go/` projects beyond removing husky dependencies from `ts/package.json`.
- We are not changing the commit message convention (it remains conventional commits).

## Decisions

- **Root `package.json`**: We will create a `package.json` at the root directory specifically to manage husky, commitlint, and other repo-level development tools. This isolates repo-level tools from the `ts/` project's dependencies.
- **Hook Scripts**: The husky init script will be run at the root. We will copy any existing hooks from `ts/.husky` to the root `.husky` folder and update their paths if they referenced scripts in `ts/`.
- **TS Dependency Cleanup**: We will remove `husky`, `@commitlint/cli`, `@commitlint/config-conventional` and similar dependencies from `ts/package.json` to avoid duplication.

## Risks / Trade-offs

- [Risk] Running `pnpm install` might now be required at the root level as well as within `ts/`. → Mitigation: We can document this in the README or use a pnpm workspace if needed. For now, documenting it is sufficient.
- [Risk] Hooks might fail to find Node.js or `pnpm` if the developer environment path is weird during git operations. → Mitigation: Husky typically handles this well via standard `~/.huskyrc` mechanisms if needed, but it should work out of the box.
