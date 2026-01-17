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
import { TaskRunner, TaskStep } from "./src";

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
    const valid = ctx.issueBody.includes("github.com");
    return valid
      ? { status: "success" }
      : { status: "failure", error: "Invalid URL" };
  },
};

const DataLoaderStep: TaskStep<ValidationContext> = {
  name: "DataLoaderStep",
  dependencies: ["UrlFormatStep"],
  run: async (ctx) => {
    // Simulate API call
    ctx.prData = { additions: 20, ciStatus: "success" };
    return { status: "success", message: "Data fetched" };
  },
};

const MaxChangesStep: TaskStep<ValidationContext> = {
  name: "MaxChangesStep",
  dependencies: ["DataLoaderStep"],
  run: async (ctx) => {
    // Safe access because dependencies ensured execution order
    if (!ctx.prData) return { status: "failure", error: "Missing PR Data" };

    return ctx.prData.additions < 50
      ? { status: "success" }
      : { status: "failure", error: "Too many changes" };
  },
};

// 3. Execute the runner
async function main() {
  const context: ValidationContext = {
    issueBody: "https://github.com/org/repo/pull/1",
  };

  const runner = new TaskRunner(context);

  const steps = [UrlFormatStep, DataLoaderStep, MaxChangesStep];
  const results = await runner.execute(steps);

  console.table(Object.fromEntries(results));
}

main();
```

## Context Hydration

One nice thing to do is to avoid optional parameters and excessive use of `!` operator, with task dependencies we can chain our steps and context usages to make sure steps are executed only when pre requisites are met.

This decouples **Data Loading** from **Business Logic**.

### Scenario: User Profile Validation

Imagine you need to validate if a user is a "Pro" member. You shouldn't mix the API fetching logic with the validation logic.

1.  **Initial State**: The context starts with only a `userId`.
2.  **Hydration Step**: A `UserLoaderStep` runs first. It fetches data from an API and attaches it to the context.
3.  **Logic Step**: A `PremiumCheckStep` runs next. It doesn't need to know _how_ the data was fetched; it simply checks the `isPro` flag in the context.

```typescript
interface MyProjectContext {
  rawInput: string;
}

interface MyProjectFullContext extends MyProjectContext {
  apiData: {
    user: string;
    isPro: boolean;
  };
}

// Step 1: Hydrate the context
class UserLoaderStep implements TaskStep<MyProjectContext> {
  name = "UserLoaderStep";
  async run(ctx: MyProjectContext & Partial<MyProjectFullContext>) {
    // Fetch data and update context
    ctx.apiData = { user: "john_doe", isPro: true };
    return { status: "success" };
  }
}

// Step 2: Use the hydrated data
class PremiumCheckStep implements TaskStep<MyProjectContext> {
  name = "PremiumCheckStep";
  dependencies = ["UserLoaderStep"]; // Ensures data is ready

  async run(ctx: MyProjectFullContext) {
    return ctx.apiData.isPro
      ? { status: "success" }
      : { status: "failure", error: "User is not a Pro member" };
  }
}
```

This approach allows `PremiumCheckStep` to be easily tested with mock data, as it doesn't depend on the actual API loader.

## Why I did this?

In my company I have a Github Issue validation engine that checks **a lot** of stuff and I wanted to make a package that encapsulates the "validation engine" logic for use outside that niche case. I don't know if someone will find it useful but here it is.

## What is .gemini and .specify

One of the reasons this project exists is to test 'code vibing' tools, so yes, this is vibe coded. My goal is to not touch the code and see if works.
