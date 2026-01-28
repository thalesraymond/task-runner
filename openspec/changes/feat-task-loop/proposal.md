# Change: Add Task Loop (Polling) Support

## Why
Users frequently need to wait for asynchronous external conditions (e.g., "Server Ready", "Report Generated") before proceeding. Currently, they must implement manual `while` loops inside task logic or misuse the Retry system. Manual loops block the execution slot and lack visibility, while abusing Retries conflates "errors" with "pending states".

## What Changes
- **TaskStep Interface**: Add optional `loop` configuration.
- **Loop Configuration**: Define `interval` (delay between checks), `maxIterations` (timeout safety), and `until` (completion predicate).
- **Execution Strategy**: Introduce `LoopingExecutionStrategy` to handle repetition logic transparently.

## Impact
- Affected specs: `task-runner`
- Affected code: `src/TaskStep.ts`, `src/contracts/TaskLoopConfig.ts`, `src/strategies/LoopingExecutionStrategy.ts`
