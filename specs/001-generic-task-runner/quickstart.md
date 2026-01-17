# Quickstart: Using the Generic Task Runner

This guide demonstrates how to use the `TaskRunner` to execute a simple workflow with dependencies.

## 1. Define Your Context

First, define the shape of the shared `context` object that your tasks will use.

```typescript
// Define the data structure that will be shared across tasks.
interface MyWorkflowContext {
  userId: string;
  userData?: {
    name: string;
    permissions: string[];
  };
  hasSufficientPermissions?: boolean;
}
```

## 2. Create Your Task Steps

Define your individual tasks. Each task is an object that implements the `TaskStep` interface.

```typescript
import { TaskStep, TaskResult } from './task-runner'; // Assuming types are in this module

// A task to fetch user data
const fetchUserData: TaskStep<MyWorkflowContext> = {
  name: 'FetchUserData',
  run: async (context): Promise<TaskResult> => {
    console.log('Fetching data for user:', context.userId);
    // In a real app, you would make an API call here.
    context.userData = { name: 'Jane Doe', permissions: ['read:articles'] };
    return { status: 'success', message: 'User data fetched.' };
  },
};

// A task to check for specific permissions
const checkPermissions: TaskStep<MyWorkflowContext> = {
  name: 'CheckPermissions',
  dependencies: ['FetchUserData'], // This task runs only after FetchUserData succeeds
  run: async (context): Promise<TaskResult> => {
    console.log('Checking permissions...');
    const hasPermission =
      context.userData?.permissions.includes('write:articles');
    context.hasSufficientPermissions = hasPermission;

    if (hasPermission) {
      return { status: 'success', message: 'User has sufficient permissions.' };
    } else {
      return {
        status: 'failure',
        error: 'User does not have "write:articles" permission.',
      };
    }
  },
};

// A final task that depends on the permission check
const publishArticle: TaskStep<MyWorkflowContext> = {
  name: 'PublishArticle',
  dependencies: ['CheckPermissions'],
  run: async (context): Promise<TaskResult> => {
    // Because this task depends on CheckPermissions, which would have failed,
    // the runner will automatically skip this step.
    console.log('Publishing article...');
    return { status: 'success', message: 'Article published!' };
  },
};
```

## 3. Execute the Workflow

Instantiate the `TaskRunner` with your initial context and execute the steps.

```typescript
import { TaskRunner } from './task-runner';

async function main() {
  // 1. Initialize the context
  const initialContext: MyWorkflowContext = {
    userId: 'user-123',
  };

  // 2. Create an instance of the runner
  const runner = new TaskRunner(initialContext);

  // 3. Define the list of all steps
  const allSteps = [fetchUserData, checkPermissions, publishArticle];

  // 4. Execute and await the results
  const results = await runner.execute(allSteps);

  // 5. Print the results
  console.log('\nWorkflow finished. Results:');
  console.table(Object.fromEntries(results));
}

main();
```

### Expected Output

The `console.table` output will look something like this, clearly showing that `PublishArticle` was skipped due to the failure in `CheckPermissions`.

| Task Name          | Status    | Message / Error                                 |
| ------------------ | --------- | ----------------------------------------------- |
| `FetchUserData`    | `success` | User data fetched.                              |
| `CheckPermissions` | `failure` | User does not have "write:articles" permission. |
| `PublishArticle`   | `skipped` | _(no message)_                                  |

```

```
