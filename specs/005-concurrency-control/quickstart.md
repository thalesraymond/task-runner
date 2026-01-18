# Quickstart: Concurrency Control

This guide provides a quick introduction to the new concurrency control capabilities of the Generic Task Runner, specifically how to limit the number of tasks running simultaneously.

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

Here's how to define tasks and then use the `TaskRunner` with its new concurrency control feature.

### 1. Define Task Steps

Define your `TaskStep`s as usual. For demonstrating concurrency, it's useful to have tasks that simulate work.

```typescript
import { TaskStep, TaskRunner, TaskRunnerConfig } from '@your-package-name/task-runner'; // Adjust import path

interface MyContext {
  logs: string[];
}

const createTask = (name: string, duration: number): TaskStep<MyContext> => ({
  name: name,
  run: async (context, signal) => {
    const startTime = Date.now();
    console.log(`[${name}] Started at ${new Date(startTime).toLocaleTimeString()}`);
    try {
      await new Promise(resolve => setTimeout(resolve, duration));
      if (signal.aborted) {
        console.log(`[${name}] Aborted after ${Date.now() - startTime}ms`);
        context.logs.push(`[${name}] Aborted`);
        return;
      }
      console.log(`[${name}] Finished after ${Date.now() - startTime}ms`);
      context.logs.push(`[${name}] Completed`);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`[${name}] Caught AbortError after ${Date.now() - startTime}ms`);
        context.logs.push(`[${name}] AbortError`);
      } else {
        throw error;
      }
    }
  },
});

const task1 = createTask('Task A', 1000); // 1 second
const task2 = createTask('Task B', 1500); // 1.5 seconds
const task3 = createTask('Task C', 500);  // 0.5 seconds
const task4 = createTask('Task D', 1200); // 1.2 seconds
const task5 = createTask('Task E', 800);  // 0.8 seconds
```

### 2. Run with Concurrency Limit

Set the `concurrency` property in the `TaskRunnerConfig` to limit the number of tasks running simultaneously.

```typescript
import { TaskRunner } from '@your-package-name/task-runner';
// ... (TaskStep definitions from above) ...

async function runWithLimitedConcurrency() {
  const runner = new TaskRunner<MyContext>();
  runner.addTask(task1);
  runner.addTask(task2);
  runner.addTask(task3);
  runner.addTask(task4);
  runner.addTask(task5);

  const config: TaskRunnerConfig = { concurrency: 2 }; // Allow only 2 tasks to run at a time

  console.log('Starting workflow with concurrency limit of 2...');
  const results = await runner.runAll({ logs: [] }, config);

  console.log('\n--- Limited Concurrency Scenario Results ---');
  results.forEach(result => {
    console.log(`Task: ${result.taskName}, Status: ${result.status}`);
  });
  console.log('Execution Logs:', runner.context.logs);
}

runWithLimitedConcurrency();
```

When you run the above code, you should observe that only two tasks start simultaneously. As one finishes, another from the queue will begin.

### 3. Run with Unlimited Concurrency (Default Behavior)

If `concurrency` is not specified, or explicitly set to `0` or `Infinity`, the `TaskRunner` will run all independent tasks in parallel, as per its default behavior.

```typescript
import { TaskRunner } from '@your-package-name/task-runner';
// ... (TaskStep definitions from above) ...

async function runWithUnlimitedConcurrency() {
  const runner = new TaskRunner<MyContext>();
  runner.addTask(task1);
  runner.addTask(task2);
  runner.addTask(task3);
  runner.addTask(task4);
  runner.addTask(task5);

  // No concurrency limit specified, or set to { concurrency: 0 } or { concurrency: Infinity }
  console.log('Starting workflow with unlimited concurrency (default behavior)...');
  const results = await runner.runAll({ logs: [] });

  console.log('\n--- Unlimited Concurrency Scenario Results ---');
  results.forEach(result => {
    console.log(`Task: ${result.taskName}, Status: ${result.status}`);
  });
  console.log('Execution Logs:', runner.context.logs);
}

runWithUnlimitedConcurrency();
```

In this scenario, all tasks (`Task A` through `Task E`) should start almost simultaneously.

This quickstart demonstrates how to utilize the `concurrency` option to manage task execution flow effectively.
