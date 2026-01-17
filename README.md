# Generic Task Runner

A lightweight, type-safe, and domain-agnostic task orchestration engine. It resolves a Directed Acyclic Graph (DAG) of steps, executes independent tasks in parallel, and manages a shared context across the pipeline.

## Features

- **Domain Agnostic**: Separate your business logic ("What") from the execution engine ("How").
- **Type-Safe Context**: Fully typed shared state using TypeScript Generics.
- **Parallel Execution**: Automatically identifies and runs independent steps concurrently.
- **Dependency Management**: Enforces execution order based on dependencies.
- **Error Handling & Skipping**: robustly handles failures and automatically skips dependent steps.

## Usage Example

Here is a simple example showing how to define a context, create steps, and execute them.

```typescript
import { TaskRunner, TaskStep } from './src';

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
  name: 'UrlFormatStep',
  run: async (ctx) => {
    const valid = ctx.issueBody.includes('github.com');
    return valid
      ? { status: 'success' }
      : { status: 'failure', error: 'Invalid URL' };
  }
};

const DataLoaderStep: TaskStep<ValidationContext> = {
  name: 'DataLoaderStep',
  dependencies: ['UrlFormatStep'],
  run: async (ctx) => {
    // Simulate API call
    ctx.prData = { additions: 20, ciStatus: 'success' };
    return { status: 'success', message: 'Data fetched' };
  }
};

const MaxChangesStep: TaskStep<ValidationContext> = {
  name: 'MaxChangesStep',
  dependencies: ['DataLoaderStep'],
  run: async (ctx) => {
    // Safe access because dependencies ensured execution order
    if (!ctx.prData) return { status: 'failure', error: 'Missing PR Data' };

    return ctx.prData.additions < 50
      ? { status: 'success' }
      : { status: 'failure', error: 'Too many changes' };
  }
};

// 3. Execute the runner
async function main() {
  const context: ValidationContext = {
    issueBody: "https://github.com/org/repo/pull/1"
  };

  const runner = new TaskRunner(context);

  const steps = [UrlFormatStep, DataLoaderStep, MaxChangesStep];
  const results = await runner.execute(steps);

  console.table(Object.fromEntries(results));
}

main();
```

## Context Hydration

One of the most powerful features of this runner is **Context Hydration**. This pattern allows you to start with a minimal context (e.g., just an ID or a URL) and progressively "hydrate" it with more data as steps execute.

This decouples **Data Loading** from **Business Logic**.

### Scenario: User Profile Validation

Imagine you need to validate if a user is a "Pro" member. You shouldn't mix the API fetching logic with the validation logic.

1.  **Initial State**: The context starts with only a `userId`.
2.  **Hydration Step**: A `UserLoaderStep` runs first. It fetches data from an API and attaches it to the context.
3.  **Logic Step**: A `PremiumCheckStep` runs next. It doesn't need to know *how* the data was fetched; it simply checks the `isPro` flag in the context.

```typescript
interface MyProjectContext {
  rawInput: string;
  apiData?: {
    user: string;
    isPro: boolean;
  };
}

// Step 1: Hydrate the context
class UserLoaderStep implements TaskStep<MyProjectContext> {
  name = "UserLoaderStep";
  async run(ctx: MyProjectContext) {
    // Fetch data and update context
    ctx.apiData = { user: "john_doe", isPro: true };
    return { status: 'success' };
  }
}

// Step 2: Use the hydrated data
class PremiumCheckStep implements TaskStep<MyProjectContext> {
  name = "PremiumCheckStep";
  dependencies = ["UserLoaderStep"]; // Ensures data is ready

  async run(ctx: MyProjectContext) {
    // We can confidently access apiData because of the dependency
    return ctx.apiData!.isPro
      ? { status: 'success' }
      : { status: 'failure', error: "User is not a Pro member" };
  }
}
```

This approach allows `PremiumCheckStep` to be easily tested with mock data, as it doesn't depend on the actual API loader.
