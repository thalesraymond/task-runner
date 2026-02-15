# Post-Task Hooks Requirements

## ADDED Requirements

### Requirement: Execute Post-Task Hooks after task execution

The `WorkflowExecutor` MUST execute all registered post-task hooks after a task completes (success or failure).

#### Scenario: Running post hooks
Given registered post-task hooks
When a task finishes execution
Then hooks are executed sequentially with access to the task result

### Requirement: Modify result via hook

The runner MUST allow post-task hooks to modify the task result.

#### Scenario: Modifying result status
Given a post-task hook that returns a new `TaskResult`
When a task finishes
Then the final result of the task is updated to the one returned by the hook
