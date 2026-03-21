## 1. Implementation

- [ ] 1.1 Create `src/plugins/CLIReporterPlugin.ts` implementing `Plugin<TContext>`.
- [ ] 1.2 Implement event listeners for `taskStart`, `taskEnd`, `taskFailed`, and `taskSkipped`.
- [ ] 1.3 Implement real-time console rendering logic (e.g., using ANSI escape sequences or a minimal progress library) to display running tasks.
- [ ] 1.4 Implement a summary output function to display total execution time, successful tasks, failed tasks, and skipped tasks at the end of the workflow.
- [ ] 1.5 Write unit and integration tests in `tests/plugins/CLIReporterPlugin.test.ts`.
- [ ] 1.6 Update `README.md` to document the new `CLIReporterPlugin` usage.
