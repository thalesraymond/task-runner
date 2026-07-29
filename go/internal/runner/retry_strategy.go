package runner

import (
	"context"
	"time"
)

// RetryStrategy wraps an ExecutionStrategy and retries on failure up to
// a configurable number of times with a fixed backoff between attempts.
// It respects context cancellation between retry attempts.
type RetryStrategy[T any] struct {
	maxRetries int
	backoff    time.Duration
	inner      ExecutionStrategy[T]
}

// NewRetryStrategy creates a RetryStrategy that retries failed executions.
// The inner strategy is called on each attempt. If it succeeds, the result
// is returned immediately. On failure, the strategy waits for the backoff
// duration (or context cancellation) before retrying.
func NewRetryStrategy[T any](maxRetries int, backoff time.Duration, inner ExecutionStrategy[T]) *RetryStrategy[T] {
	return &RetryStrategy[T]{
		maxRetries: maxRetries,
		backoff:    backoff,
		inner:      inner,
	}
}

func (s *RetryStrategy[T]) Execute(ctx context.Context, task Task[T], sharedState T) TaskResult {
	var lastResult TaskResult
	for attempt := 0; attempt <= s.maxRetries; attempt++ {
		// Check context before each attempt
		select {
		case <-ctx.Done():
			return TaskResult{Status: StatusCancelled, Err: ctx.Err()}
		default:
		}

		lastResult = s.inner.Execute(ctx, task, sharedState)
		if lastResult.Status != StatusFailure {
			return lastResult
		}

		// Wait before retrying (with context support)
		if attempt < s.maxRetries {
			select {
			case <-time.After(s.backoff):
			case <-ctx.Done():
				return TaskResult{Status: StatusCancelled, Err: ctx.Err()}
			}
		}
	}
	return lastResult
}
