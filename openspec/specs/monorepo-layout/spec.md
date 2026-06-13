# monorepo-layout Specification

## Purpose

TBD - created by archiving change go-rewrite-setup. Update Purpose after archive.

## Requirements

### Requirement: TypeScript project resides in ts/ subdirectory
All TypeScript source code, test code, and configuration files SHALL be located under the `ts/` subdirectory. The `ts/` directory SHALL be a self-contained pnpm project with its own `package.json`, `tsconfig.json`, `vitest.config.ts`, `eslint.config.js`, and `pnpm-lock.yaml`.

#### Scenario: Building the TypeScript project
- **WHEN** a developer runs `pnpm build` from the `ts/` directory
- **THEN** the TypeScript compiler SHALL produce output in `ts/dist/` with the same artifacts as before the reorganization

#### Scenario: Running tests from ts/ directory
- **WHEN** a developer runs `pnpm test` from the `ts/` directory
- **THEN** all existing tests SHALL pass with 100% coverage thresholds maintained

#### Scenario: Linting from ts/ directory
- **WHEN** a developer runs `pnpm lint` from the `ts/` directory
- **THEN** ESLint SHALL analyze `ts/src/` and `ts/tests/` with zero errors

### Requirement: Go project resides in go/ subdirectory
The Go module SHALL be located under the `go/` subdirectory with its own `go.mod` and project layout.

#### Scenario: Independent directory structure
- **WHEN** a developer inspects the repository root
- **THEN** the root SHALL contain `ts/` and `go/` as the two language-specific subdirectories, alongside shared repo-level files

### Requirement: Repository root contains only shared files
The repository root SHALL contain only files that are shared across both language implementations: `README.md`, `LICENSE`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `.gitignore`, `sonar-project.properties`, and directories `.git/`, `.github/`, `.husky/`, `.vscode/`, `.idea/`, `openspec/`, `conductor/`, `.agent/`, `.gemini/`, `.jules/`.

#### Scenario: No language-specific config at root
- **WHEN** a developer lists the repository root
- **THEN** there SHALL be no `package.json`, `tsconfig.json`, `vitest.config.ts`, `eslint.config.js`, `go.mod`, or other language-specific configuration files at the root level

### Requirement: CI workflows use working-directory for language isolation
All GitHub Actions CI workflow jobs SHALL use the `working-directory` field to scope steps to the correct language subdirectory rather than relying on `cd` commands.

#### Scenario: TypeScript CI runs from ts/ directory
- **WHEN** the CI workflow runs TypeScript build, test, and lint steps
- **THEN** each step SHALL execute with `working-directory: ts/`

### Requirement: Release-please targets ts/ package
The release-please configuration SHALL reference the `ts/` subdirectory as the package location, ensuring version bumps apply to `ts/package.json`.

#### Scenario: Release-please creates version bump PR
- **WHEN** release-please detects conventional commits
- **THEN** it SHALL update the version in `ts/package.json` (not a root-level `package.json`)

### Requirement: SonarQube paths reference ts/ subdirectory
The `sonar-project.properties` file SHALL use `ts/src` for `sonar.sources` and `ts/tests` for `sonar.tests`.

#### Scenario: SonarQube scans correct directories
- **WHEN** the SonarQube scanner runs from the repository root
- **THEN** it SHALL analyze source files in `ts/src/` and test files in `ts/tests/`

### Requirement: Git history preserved for moved files
All file moves SHALL be performed using `git mv` to preserve blame history and enable `git log --follow` to trace file lineage.

#### Scenario: Tracing history of a moved file
- **WHEN** a developer runs `git log --follow ts/src/TaskRunner.ts`
- **THEN** the log SHALL include commits from before the reorganization when the file was at `src/TaskRunner.ts`
