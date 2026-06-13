## Context

The task-runner is a single-language TypeScript project at the repository root. All config files (`package.json`, `tsconfig.json`, `vitest.config.ts`, etc.), source (`src/`), and tests (`tests/`) live at the top level. CI workflows, release-please, SonarQube, and npm publish all assume this flat layout.

The project is being rewritten in Go. During the migration period, both implementations must coexist. The current flat structure makes this impossible without constant conflicts in config files, CI pipelines, and tooling.

## Goals / Non-Goals

**Goals:**
- Relocate the entire TypeScript project (source, tests, configs, lockfile) into `ts/` without breaking any build, test, lint, or publish pipeline.
- Initialize a Go module at `go/` with idiomatic project layout (`cmd/`, `internal/`, `go.mod`).
- Update all CI/CD workflows to operate against the correct subdirectories.
- Update root documentation (`README.md`, `AGENTS.md`, `openspec/project.md`) to reflect the polyglot structure.
- Preserve git history (use `git mv` for all file moves).

**Non-Goals:**
- Implementing any Go task-runner logic — this change is scaffolding only.
- Converting the pnpm workspace into a monorepo manager (e.g., Turborepo, Nx). The `ts/` subdirectory is a standalone pnpm project.
- Changing the npm package name, version, or public API.
- Migrating Husky hooks to run from `ts/` — hooks remain at the repo root and invoke `ts/` scripts.

## Decisions

### D1: Directory naming — `ts/` and `go/` (not `typescript/` and `golang/`)

Short, idiomatic names match Go ecosystem conventions (`go/` is standard in polyglot repos). `ts/` mirrors this brevity. Alternatives like `packages/ts` add unnecessary nesting for a two-language repo.

### D2: Root-level files stay at root

Files that are repo-wide concerns stay at root:
- `README.md`, `LICENSE`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `CHANGELOG.md`
- `.git/`, `.github/`, `.husky/`, `.vscode/`, `.idea/`
- `openspec/`, `conductor/`, `.agent/`, `.gemini/`, `.jules/`

Language-specific files move into their respective subdirectories. This keeps the root clean and makes it clear which files belong to which language.

### D3: CI working-directory strategy

Each CI job uses `working-directory: ts/` (or `go/`) rather than `cd`-based scripting. This is the GitHub Actions-native approach and keeps steps declarative. Future Go CI jobs will use `working-directory: go/`.

### D4: Go project layout follows `golang-standards/project-layout`

```
go/
├── cmd/
│   └── task-runner/
│       └── main.go        # Entry point stub
├── internal/               # Private packages (enforced by Go compiler)
│   └── runner/
│       └── runner.go       # Placeholder package
├── go.mod
└── README.md
```

Using `internal/` from day one enforces encapsulation. `cmd/task-runner/` establishes the binary name early.

### D5: Sonar properties stay at root, paths updated

`sonar-project.properties` remains at root (SonarQube scanner expects it there) but `sonar.sources` and `sonar.tests` update to `ts/src` and `ts/tests`. When Go analysis is added later, additional paths will be appended.

### D6: Release-please paths update to `ts/`

`release-please-config.json` changes the package path from `"."` to `"ts"`. `.release-please-manifest.json` mirrors this. This ensures version bumps target `ts/package.json`.

### D7: Use `git mv` for all file moves

Preserves blame history and makes the reorganization a single atomic commit that reviewers can verify via `git log --follow`.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Developers with stale clones may have broken paths after pull | Document in commit message and PR description; `pnpm install` will fail fast with clear error |
| Dependabot config references may break | Update `.github/dependabot.yml` directory field to `ts/` |
| External tools hardcoded to root paths (IDE configs, editor plugins) | `.vscode/` and `.idea/` settings updated; documented in README |
| Husky hooks at root calling `pnpm` commands that now need `--dir ts` | Update hook scripts to `cd ts && pnpm ...` or use `--prefix` |
| Go module path selection affects future importability | Use `github.com/thalesraymond/task-runner/go` — matches repo structure and is idiomatic |
