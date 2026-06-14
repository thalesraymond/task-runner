## Why

Currently, the Husky configuration and commit helper are located within the `ts/` directory. This requires developers to change directories (`cd ts`) before they can use the commit helper or have Git hooks automatically run for actions at the repository root. Moving Husky to the repository root simplifies the workflow, allowing developers to run commit commands from anywhere in the project.

## What Changes

- Move the `.husky` directory from `ts/` to the project root `/`.
- Move any Husky-related setup scripts or configurations from `ts/package.json` to a root `package.json` or configure Husky to run properly from the root.
- Ensure the commit helper is accessible and executable from the root directory.

## Capabilities

### New Capabilities
- `root-level-husky`: The ability to run the commit helper and trigger Git hooks from the repository root directory.

### Modified Capabilities
- 

## Impact

- Development workflow: Developers will no longer need to `cd ts` to run commits.
- Repository structure: A new `package.json` might be needed at the root just for husky, or husky will be configured to work from the root while the main `package.json` remains in `ts/`.
- Git Hooks: All Git hooks will be executed from the root context.
