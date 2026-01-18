# Quickstart: Task Cancellation

This guide provides a quick introduction to the new task cancellation capabilities of the Generic Task Runner, including how to use `AbortSignal` for external cancellation and a global `timeout` for workflow termination.

## Installation

Assuming you have `Node.js` and `npm`/`pnpm`/`yarn` installed:

```bash
# If using npm
npm install @your-package-name/task-runner

# If using pnpm
pnpm add @your-package-name/task-runner

# If using yarn
yarn add @your-package-name/task-runner
```

*(Note: Replace `@your-package-name/task-runner` with the actual package name once published.)*

## Basic Usage

Here's how to define tasks and then use the `TaskRunner` with its new cancellation features.

### 1. Define Task Steps

Task steps now receive an `AbortSignal` as their second argument, allowing them to react to cancellation requests gracefully.

```typescript
import { TaskStep, TaskRunner, TaskRunnerConfig } from '@your-package-name/task-runner'; // Adjust import path

interface MyContext {
  data: string[];
  processedCount: number;
}

const longRunningTask: TaskStep<MyContext> = {
  name: 'longRunningOperation',
  run: async (context, signal) => {
    console.log('Task: Long running operation started...');
    try {
      for (let i = 0; i < 10; i++) {
        // Check for cancellation signal
        if (signal.aborted) {
          console.log('Task: Long running operation aborted early.');
          return; // Exit gracefully
        }
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate work
        console.log(`Task: Work unit ${i + 1} completed.`);
      }
      console.log('Task: Long running operation finished.');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Task: Long running operation caught AbortError.');
      } else {
        throw error;
      }
    }
  },
};

const dependentTask: TaskStep<MyContext> = {
  name: 'dependentOperation',
  dependencies: ['longRunningOperation'],
  run: async (context) => {
    console.log('Task: Dependent operation started. This should only run if the previous task completes.');
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('Task: Dependent operation finished.');
  },
};

const anotherTask: TaskStep<MyContext> = {
  name: 'anotherOperation',
  run: async () => {
    console.log('Task: Another independent operation.');
    await new Promise(resolve => setTimeout(resolve, 50))
  }
};
```

### 2. External Cancellation with `AbortSignal`

You can use an `AbortController` to cancel the `TaskRunner` workflow externally.

```typescript
import { TaskRunner } from '@your-package-name/task-runner';
// ... (TaskStep definitions from above) ...

async function runWithAbortSignal() {
  const runner = new TaskRunner<MyContext>();
  runner.addTask(longRunningTask);
  runner.addTask(dependentTask);
  runner.addTask(anotherTask);

  const abortController = new AbortController();
  const config: TaskRunnerConfig = { signal: abortController.signal };

  console.log('Starting workflow with AbortSignal. Will abort in 1.2 seconds...');
  const runPromise = runner.runAll({ data: [], processedCount: 0 }, config);

  // Abort the workflow after some time
  setTimeout(() => {
    console.log('Aborting workflow now!');
    abortController.abort();
  }, 1200);

  const results = await runPromise;

  console.log('\n--- AbortSignal Scenario Results ---');
  results.forEach(result => {
    console.log(`Task: ${result.taskName}, Status: ${result.status}, Message: ${result.message || 'N/A'}`);
  });
}

runWithAbortSignal();
```

### 3. Global Timeout for Workflow

Set a `timeout` in the `TaskRunnerConfig` to automatically cancel the workflow after a specified duration.

```typescript
import { TaskRunner } from '@your-package-name/task-runner';
// ... (TaskStep definitions from above) ...

async function runWithTimeout() {
  const runner = new TaskRunner<MyContext>();
  runner.addTask(longRunningTask); // This task takes 5 seconds (10 * 500ms)
  runner.addTask(dependentTask);
  runner.addTask(anotherTask);

  const config: TaskRunnerConfig = { timeout: 2000 }; // 2 seconds timeout

  console.log('Starting workflow with 2-second global timeout...');
  const results = await runner.runAll({ data: [], processedCount: 0 }, config);

  console.log('\n--- Timeout Scenario Results ---');
  results.forEach(result => {
    console.log(`Task: ${result.taskName}, Status: ${result.status}, Message: ${result.message || 'N/A'}`);
  });
}

runWithTimeout();
```

### 4. Combined Cancellation

When both `signal` and `timeout` are provided, the first event to occur will trigger the cancellation.

```typescript
import { TaskRunner } from '@your-package-name/task-runner';
// ... (TaskStep definitions from above) ...

async function runWithCombinedCancellation() {
  const runner = new TaskRunner<MyContext>();
  runner.addTask(longRunningTask);
  runner.addTask(dependentTask);

  const abortController = new AbortController();
  const config: TaskRunnerConfig = {
    signal: abortController.signal,
    timeout: 5000 // 5 seconds timeout
  };

  console.log('Starting workflow with AbortSignal (triggers in 1.5s) and 5s timeout...');
  const runPromise = runner.runAll({ data: [], processedCount: 0 }, config);

  setTimeout(() => {
    console.log('Triggering AbortSignal now (before timeout)!');
    abortController.abort();
  }, 1500);

  const results = await runPromise;

  console.log('\n--- Combined Cancellation Scenario Results ---');
  results.forEach(result => {
    console.log(`Task: ${result.taskName}, Status: ${result.status}, Message: ${result.message || 'N/A'}`);
  });
}

runWithCombinedCancellation();
```

This quickstart demonstrates how to integrate cancellation and timeout mechanisms into your task workflows.
