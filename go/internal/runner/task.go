package runner

import "context"

// TaskResult holds the outcome of a single task execution.
// The zero value represents a successful result with no error,
// which aligns with Go's convention of zero = good.
type TaskResult struct {
	// Status is the discrete outcome of the task.
	Status TaskStatus
	// Err holds any error returned by the task.
	// It is non-nil only when Status is StatusFailure or StatusCancelled.
	Err error
}

// Task is the core interface that every executable unit must satisfy.
// T is the type of the shared context object passed across all tasks
// in a workflow, providing type-safe state propagation without runtime
// type assertions.
//
// Implementations must:
//   - Return a TaskResult reflecting the final outcome.
//   - Respect ctx cancellation and return StatusCancelled when ctx is done.
//   - Never panic; surface errors through TaskResult.Err instead.
type Task[T any] interface {
	// Run executes the task logic.
	// ctx carries deadlines, cancellation signals, and request-scoped values.
	// sharedState is the workflow-wide shared context passed by the runner.
	Run(ctx context.Context, sharedState T) TaskResult
}
