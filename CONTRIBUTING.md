# Contributing to task-runner

First off, thanks for taking the time to contribute!

The following is a set of guidelines for contributing to `@calmo/task-runner`. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## Code of Conduct

This project and everyone participating in it is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

1.  **Fork the repository** on GitHub.
2.  **Clone your fork** locally.
    ```bash
    git clone https://github.com/your-username/task-runner.git
    cd task-runner
    ```
3.  **Install dependencies** using `pnpm`.
    ```bash
    pnpm install
    ```
    _Note: This project uses `pnpm` for package management. Please do not use `npm` or `yarn`._

## Development Workflow

1.  **Create a branch** for your feature or fix.
    ```bash
    git checkout -b feature/my-new-feature
    ```
2.  **Make your changes**.
3.  **Run checks** locally to ensure your changes are valid.

### Scripts & Commands

The project uses several `pnpm` scripts to maintain code quality:

- **Build**: Compile the project.
  ```bash
  pnpm build
  ```
- **Test**: Run tests with coverage.
  ```bash
  pnpm test
  ```
  **Important**: We enforce **100% code coverage**. If your changes lower the coverage, the CI will fail.
- **Lint**: Check for linting errors.
  ```bash
  pnpm lint
  ```
- **Format**: Format the code using Prettier.
  ```bash
  pnpm format
  ```

## Coding Standards

Please strictly adhere to the following rules:

- **No `any`**: The use of `any` type is strictly forbidden. Use `unknown` or proper types.
- **Strict Null Safety**: Do not use `??` or optional chaining `?.` when you can guarantee existence via prior validation. Use non-null assertions `!` only when the invariant is locally provable or enforced by a validator.
- **Dead Code Elimination**: Avoid `v8 ignore` comments. Logic should be structured to prove unreachability.
- **Atomic Commits**: For complex features, commit after completing distinct tasks. Ensure `pnpm build`, `pnpm lint`, and `pnpm test` pass before each commit.

For more detailed agent-specific instructions (which are also good for humans), refer to `AGENTS.md`.

## Commit Messages

We follow the **Conventional Commits** specification.

You can use the built-in helper to format your commit messages:

```bash
pnpm commit
```

Or format them manually:

- `feat(scope): add new feature`
- `fix(scope): fix bug`
- `docs: update documentation`
- `test: add tests`
- `refactor: refactor code`

## Submitting a Pull Request

1.  Push your changes to your fork.
2.  Open a Pull Request against the `main` branch.
3.  Ensure the PR description clearly describes the problem and solution.
4.  Make sure all CI checks pass.

Thank you for your contributions!
