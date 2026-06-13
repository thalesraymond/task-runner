// Package runner provides the core task orchestration logic for the Go
// implementation of the task-runner. This package is currently a scaffold
// and will be expanded during the Go rewrite.
package runner

// Runner orchestrates the execution of a task graph.
// It resolves dependencies, executes tasks in parallel where possible,
// and propagates cancellation via context.
type Runner struct {
	// concurrency limits the number of tasks running simultaneously.
	// A value of 0 means unlimited.
	concurrency int
}

// New creates a new Runner with the given concurrency limit.
func New(concurrency int) *Runner {
	return &Runner{concurrency: concurrency}
}
