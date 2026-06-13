## 1. Setup Root Configuration

- [ ] 1.1 Initialize a new `package.json` at the repository root
- [ ] 1.2 Move `husky`, `@commitlint/cli`, and `@commitlint/config-conventional` dependencies from `ts/package.json` to the root `package.json`
- [ ] 1.3 Update the root `package.json` to include a `prepare` script that runs `husky`
- [ ] 1.4 Move `.commitlintrc.json` (or similar commitlint configuration) from `ts/` to the repository root

## 2. Update Husky Scripts

- [ ] 2.1 Move the `.husky` directory from `ts/` to the root
- [ ] 2.2 Update `.husky/commit-msg` to ensure paths correctly reference the root-level `commitlint` (if it was previously relying on relative paths inside `ts/`)
- [ ] 2.3 Update `.husky/pre-commit` to ensure that checks (e.g., linting, testing) either cd into `ts/` and `go/` properly or use a root-level workspace command

## 3. Cleanup

- [ ] 3.1 Verify there are no lingering git hooks installed in `ts/.git/hooks` or similar that conflict with the root
- [ ] 3.2 Remove any duplicate scripts related to commit hooks from `ts/package.json`
- [ ] 3.3 Test committing from both the root directory and the `ts/` directory to ensure the hooks execute correctly and the commit is validated
