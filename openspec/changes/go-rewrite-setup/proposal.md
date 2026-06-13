## Why

The task-runner is being rewritten in Go for performance, static binary distribution, and reduced runtime dependencies. Before implementation begins, the repository must be reorganized into a polyglot monorepo layout: the existing TypeScript project moves into a `ts/` subdirectory, and a new `go/` subdirectory is initialized with Go module scaffolding. This separation establishes clear boundaries between the legacy TS implementation and the incoming Go codebase, allowing both to coexist, build, and be tested independently during the migration period.

## What Changes

- Move all TypeScript-specific files (`src/`, `tests/`, `package.json`, `tsconfig.json`, `tsconfig.test.json`, `vitest.config.ts`, `eslint.config.js`, `stryker.config.json`, `.prettierrc`, `.prettierignore`, `.npmignore`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `commitlint.config.js`, `node_modules/`, `dist/`, `coverage/`) into a new `ts/` subdirectory.
- Update all internal path references in TS config files (`tsconfig.json`, `vitest.config.ts`, `eslint.config.js`, `stryker.config.json`, `sonar-project.properties`) to reflect the new directory structure.
- Update CI workflows (`.github/workflows/ci.yml`, `release-please-config.json`, `.release-please-manifest.json`) to set working directory to `ts/`.
- Update `sonar-project.properties` to use `ts/src` and `ts/tests` paths.
- Initialize a Go module at `go/` with `go mod init`, a basic `go.sum`, and a minimal package stub.
- Update root `.gitignore` to cover Go build artifacts alongside existing Node/TS entries.
- Update `AGENTS.md`, `openspec/project.md`, and `README.md` to reflect the polyglot structure.

## Capabilities

### New Capabilities
- `monorepo-layout`: Establishes the `ts/` and `go/` subdirectory structure with independent build/test pipelines.
- `go-module-init`: Initializes the Go module with `go.mod`, a placeholder package, and idiomatic project layout.

### Modified Capabilities
_None — no existing spec-level behavior changes. The TS task-runner functionality is preserved as-is; only file locations change._

## Impact

- **CI/CD**: All four GitHub Actions workflows must update working directories and path references.
- **Release**: `release-please-config.json` and `.release-please-manifest.json` paths change from `.` to `ts/`.
- **SonarQube**: `sonar-project.properties` paths update to `ts/src` and `ts/tests`.
- **npm publish**: Package publish scripts and `.npmignore` move into `ts/`.
- **Developer workflow**: `pnpm install`, `pnpm build`, `pnpm test`, `pnpm lint` must be run from `ts/` (or via root orchestration).
- **Root-level files preserved**: `README.md`, `AGENTS.md`, `LICENSE`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `.git/`, `.github/`, `openspec/`, `conductor/`, `.agent/`, `.gemini/`, `.husky/`, `.vscode/`, `.idea/` stay at the repo root.
