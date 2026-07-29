package runner

import "context"

// ExecutionStrategy defines the contract for wrapping Task.Run calls.
// Different strategy implementations can add behavior around task execution
// such as retries, logging, or dry-run mode.
type ExecutionStrategy[T any] interface {
	// Execute runs the given task with the provided shared state.
	Execute(ctx context.Context, task Task[T], sharedState T) TaskResult
}

// StandardStrategy executes the task directly without any modifications.
type StandardStrategy[T any] struct{}

func (s *StandardStrategy[T]) Execute(ctx context.Context, task Task[T], sharedState T) TaskResult {
	return task.Run(ctx, sharedState)
}
