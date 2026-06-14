## Purpose
This specification defines the requirements for implementing root-level Git hooks and commit helper utilities in the task-runner repository. The goal is to ensure that developers can easily execute git hooks and commit helper commands from the repository root, streamlining the development workflow and maintaining consistency across all subdirectories.

## Requirements

### Requirement: Root-level Git Hooks and Commit Helper
The system SHALL execute git hooks and provide commit helper utilities from the repository root, without requiring the developer to navigate to subdirectories.

#### Scenario: Running commit helper from root
- **WHEN** a developer is in the repository root (`/home/thales/projects/task-runner`)
- **THEN** they can use the commit helper (e.g. `pnpm run commit` or `npx cz` if configured) directly.
- **THEN** any git commit action will trigger the configured `pre-commit` and `commit-msg` hooks.

#### Scenario: Committing from subdirectories
- **WHEN** a developer makes a commit from within `ts/` or `go/`
- **THEN** the git hooks configured at the repository root SHALL still trigger correctly.
