# Generic Task Runner

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=thalesraymond_task-runner&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=thalesraymond_task-runner)
[![codecov](https://codecov.io/gh/thalesraymond/task-runner/graph/badge.svg)](https://codecov.io/gh/thalesraymond/task-runner)
[![CI](https://github.com/thalesraymond/task-runner/actions/workflows/ci.yml/badge.svg)](https://github.com/thalesraymond/task-runner/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/@calmo%2Ftask-runner.svg)](https://www.npmjs.com/package/@calmo/task-runner)

A lightweight, type-safe, and domain-agnostic task orchestration engine. It resolves a Directed Acyclic Graph (DAG) of steps, executes independent tasks in parallel, and manages a shared context across the pipeline.

Try the [Showcase App](https://task-runner-mu.vercel.app/) to see the runner in action.

## Features

- **Domain Agnostic**: Separate your business logic ("What") from the execution engine ("How").
- **Type-Safe Context**: Fully typed shared state using TypeScript Generics.
- **Parallel Execution**: Automatically identifies and runs independent steps concurrently.
- **Dependency Management**: Enforces execution order based on dependencies.
- **Automatic Retries**: Configurable retry logic for flaky tasks.
- **Dry Run Mode**: Simulate workflow execution to verify dependency graphs.
- **Visualization**: Generate Mermaid.js diagrams of your task graph.
- **Event System**: Subscribe to lifecycle events for logging or monitoring.
- **Runtime Validation**: Automatically detects circular dependencies and missing dependencies.
- **Conditional Execution**: Skip tasks dynamically based on context state.
- **Plugin System**: Extend functionality with custom logic and event listeners.

## Usage Example

The library now provides a fluent `TaskRunnerBuilder` for easy configuration.

```typescript
import {
  TaskRunnerBuilder,
  TaskStep,
  RetryingExecutionStrategy,
  StandardExecutionStrategy
} from "@calmo/task-runner";

// 1. Define your domain-specific context
interface ValidationContext {
  issueBody: string;
  prData?: {
    additions: number;
    ciStatus: string;
  };
}

// 2. Define your steps
const UrlFormatStep: TaskStep<ValidationContext> = {
  name: "UrlFormatStep",
  run: async (ctx) => {
    if (!ctx.issueBody.includes("github.com")) {
      return { status: "failure", error: "Invalid URL" };
    }
    return { status: "success" };
  },
};

const DataLoaderStep: TaskStep<ValidationContext> = {
  name: "DataLoaderStep",
  dependencies: ["UrlFormatStep"],
  retry: {
      attempts: 3,
      delay: 1000,
      backoff: "exponential"
  },
  run: async (ctx) => {
    // Simulate API call
    ctx.prData = { additions: 20, ciStatus: "success" };
    return { status: "success", message: "Data fetched" };
  },
};

// 3. Configure and Build the Runner
async function main() {
  const context: ValidationContext = {
    issueBody: "https://github.com/org/repo/pull/1",
  };

  const runner = new TaskRunnerBuilder(context)
    .useStrategy(new RetryingExecutionStrategy(new StandardExecutionStrategy()))
    .on("taskStart", ({ step }) => console.log(`Starting: ${step.name}`))
    .on("taskEnd", ({ step, result }) => console.log(`Finished: ${step.name} -> ${result.status}`))
    .build();

  const steps = [UrlFormatStep, DataLoaderStep];
  
  // 4. Execute with options
  const results = await runner.execute(steps, {
      concurrency: 5, // Run up to 5 tasks in parallel
      timeout: 30000  // 30s timeout for the whole workflow
  });

  console.table(Object.fromEntries(results));
}

main();
```

## Advanced Configuration

### Execution Strategies

The `TaskRunner` is built on top of composable execution strategies.

- **StandardExecutionStrategy**: The default strategy that simply runs the task.
- **RetryingExecutionStrategy**: Wraps another strategy to add retry logic. Configured via the `retry` property on `TaskStep`.
- **DryRunExecutionStrategy**: Simulates execution without running the actual task logic. Useful for validating your graph or testing conditions.

You can set a strategy globally using the `TaskRunnerBuilder`:

```typescript
runnerBuilder.useStrategy(new DryRunExecutionStrategy());
```

### Execution Options

When calling `execute`, you can provide a configuration object:

- **concurrency**: Limits the number of tasks running in parallel. Defaults to unlimited.
- **timeout**: Sets a maximum execution time for the entire workflow.
- **signal**: Accepts an `AbortSignal` to cancel the workflow programmatically.
- **dryRun**: Overrides the current strategy with `DryRunExecutionStrategy` for this execution.

```typescript 
await runner.execute(steps, {
    concurrency: 2,
    dryRun: true
});
```

## Visualization

You can generate a [Mermaid.js](https://mermaid.js.org/) diagram to visualize your task dependencies.

```typescript
import { TaskRunner } from "@calmo/task-runner";

const graph = TaskRunner.getMermaidGraph(steps);
console.log(graph);
// Output: graph TD; A-->B; ...
```

## Plugin System

You can extend the `TaskRunner` with plugins to inject custom logic or listen to events without modifying the core.

### Creating a Plugin

A plugin is an object with a `name`, `version`, and an `install` method.

```typescript
import { Plugin, PluginContext } from "@calmo/task-runner";

const MyLoggerPlugin: Plugin<MyContext> = {
  name: "my-logger-plugin",
  version: "1.0.0",
  install: (context: PluginContext<MyContext>) => {
    context.events.on("taskStart", ({ step }) => {
      console.log(`[Plugin] Starting task: ${step.name}`);
    });
  },
};
```

### Using a Plugin

Register the plugin using the `use()` method on the `TaskRunner` instance.

```typescript
const runner = new TaskRunner(context);
runner.use(MyLoggerPlugin);

await runner.execute(steps);
```

## Skip Propagation

If a task fails or is skipped, the `TaskRunner` automatically marks all subsequent tasks that depend on it as `skipped`. This ensures that your pipeline doesn't attempt to run steps with missing prerequisites.

## Conditional Execution

You can define a `condition` function for a task. If it returns `false`, the task is marked as `skipped`, and its dependencies are also skipped.

```typescript
const deployStep: TaskStep<MyContext> = {
  name: "deploy",
  condition: (ctx) => ctx.env === "production",
  run: async () => {
    // Deploy logic
    return { status: "success" };
  }
};
```

## Why I did this?

In my current job I have a Github Issue validation engine that checks **a lot** of stuff and I wanted to make a package that encapsulates the "validation engine" logic for use outside that use case. I also wanted to try to make a package that is not tied to a specific scenario. I don't know if someone will find it useful but here it is. 

## AI Usage

One of the reasons this project exists is to test 'vibe coding' tools, so yes, this is vibe coded (like, A LOT, I've added myself only specs and some conflict resolutions). This repository serves as a testbed for these tools. It's a way to create a real life scenario showcasing the capabilities of agentic AI development.

## Contributing and General Usage

Feel free to open issues and PRs. I'm open to feedback and suggestions. I can't promise to act on them but I'll try my best. If you want to play with it, feel free to fork it, change it and use it in your own projects.

---
