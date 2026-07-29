package runner

import "context"

// DryRunStrategy skips the actual task execution and returns success
// immediately. This is useful for testing, validation, or "what-if"
// analysis without side effects.
type DryRunStrategy[T any] struct{}

func (s *DryRunStrategy[T]) Execute(_ context.Context, _ Task[T], _ T) TaskResult {
	return TaskResult{Status: StatusSuccess}
}
