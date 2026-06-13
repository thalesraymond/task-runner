## 1. Move TypeScript project into ts/ subdirectory

- [x] 1.1 Create `ts/` directory and `git mv` all TypeScript source and test files: `src/`, `tests/` into `ts/`
- [x] 1.2 `git mv` all TypeScript configuration files into `ts/`: `package.json`, `tsconfig.json`, `tsconfig.test.json`, `vitest.config.ts`, `eslint.config.js`, `stryker.config.json`, `.prettierrc`, `.prettierignore`, `.npmignore`, `commitlint.config.js`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`
- [x] 1.3 Move generated/ignored directories into `ts/`: `node_modules/`, `dist/`, `coverage/` (delete and regenerate via `pnpm install` from `ts/`)
- [x] 1.4 Verify all `git mv` operations preserve history by running `git log --follow ts/src/TaskRunner.ts`

## 2. Update TypeScript configuration paths

- [x] 2.1 Verify `ts/tsconfig.json` — paths (`rootDir`, `outDir`, `include`, `exclude`) are relative and should remain unchanged
- [x] 2.2 Verify `ts/tsconfig.test.json` — extends path and include globs are relative and should remain unchanged
- [x] 2.3 Verify `ts/vitest.config.ts` — test include paths are relative and should remain unchanged
- [x] 2.4 Verify `ts/eslint.config.js` — ignore patterns are relative and should remain unchanged
- [x] 2.5 Verify `ts/stryker.config.json` — mutate globs are relative and should remain unchanged

## 3. Update root-level configuration files

- [x] 3.1 Update `sonar-project.properties`: change `sonar.sources=src` to `sonar.sources=ts/src`, `sonar.tests=tests` to `sonar.tests=ts/tests`, and update coverage/report paths to `ts/coverage/lcov.info` and `ts/test-report.xml`
- [x] 3.2 Update `release-please-config.json`: change package path from `"."` to `"ts"`
- [x] 3.3 Update `.release-please-manifest.json`: change key from `"."` to `"ts"`
- [x] 3.4 Update `.gitignore`: add Go-specific entries (`go/bin/`, `*.exe`, `*.test`, `*.out`) and keep existing Node/TS entries unchanged
- [x] 3.5 Update `.github/dependabot.yml`: change npm `directory` from `"/"` to `"/ts"`, add `gomod` ecosystem entry for `"/go"`

## 4. Update CI workflows

- [x] 4.1 Update `.github/workflows/ci.yml`: add `defaults.run.working-directory: ts` to the build job, update Stryker's `git diff` path from `src/` to `ts/src/`, update SonarQube and Codecov steps to work with `ts/` paths
- [x] 4.2 Update `.github/workflows/release-please.yml`: add `working-directory: ts` to `pnpm install`, `pnpm build`, and `pnpm publish` steps
- [x] 4.3 Review `.github/workflows/codeql.yml` and `.github/workflows/mutation-nightly.yml` for any hardcoded paths and update if necessary

## 5. Update Husky hooks

- [x] 5.1 Update `.husky/pre-commit`: change `pnpm build && pnpm lint && pnpm test` to `cd ts && pnpm build && pnpm lint && pnpm test`
- [x] 5.2 Update `.husky/commit-msg`: change `npx commitlint --edit ${1}` to `cd ts && npx commitlint --edit ${1}`

## 6. Initialize Go project

- [x] 6.1 Create `go/` directory and initialize Go module: `go mod init github.com/thalesraymond/task-runner/go` with Go version `1.23`
- [x] 6.2 Create `go/cmd/task-runner/main.go` with `package main` and a stub `main()` function
- [x] 6.3 Create `go/internal/runner/runner.go` with `package runner` and a placeholder exported type
- [x] 6.4 Create `go/README.md` documenting the Go project purpose and build instructions
- [x] 6.5 Verify `go build ./...` succeeds from the `go/` directory

## 7. Update documentation

- [x] 7.1 Update root `README.md`: document the polyglot monorepo structure, add sections for both `ts/` and `go/` with build/test instructions
- [x] 7.2 Update `AGENTS.md`: reflect new directory structure, update commands section with `cd ts &&` prefixes
- [x] 7.3 Update `openspec/project.md`: add Go to tech stack, update architecture section with new directory layout, update build/test commands

## 8. Verification

- [x] 8.1 Run `cd ts && pnpm install && pnpm build` — must succeed
- [x] 8.2 Run `cd ts && pnpm test` — all tests must pass with 100% coverage
- [x] 8.3 Run `cd ts && pnpm lint` — zero lint errors
- [x] 8.4 Run `cd go && go build ./...` — must compile without errors
- [x] 8.5 Run `cd go && go vet ./...` — must pass without warnings
