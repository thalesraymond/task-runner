package runner_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/thalesraymond/task-runner/go/internal/runner"
)

// failExecutionStrategy always returns StatusFailure on Execute.
type failExecutionStrategy struct{}

func (s *failExecutionStrategy) Execute(_ context.Context, _ runner.Task[struct{}], _ struct{}) runner.TaskResult {
	return runner.TaskResult{Status: runner.StatusFailure, Err: errors.New("always fails")}
}

// TestRetryStrategy_SuccessOnFirstAttempt verifies that a successful task
// execution returns immediately without retrying.
func TestRetryStrategy_SuccessOnFirstAttempt(t *testing.T) {
	inner := &runner.StandardStrategy[struct{}]{}
	strategy := runner.NewRetryStrategy[struct{}](3, time.Millisecond, inner)
	ctx := context.Background()

	result := strategy.Execute(ctx, &simpleTask{status: runner.StatusSuccess}, struct{}{})
	if result.Status != runner.StatusSuccess {
		t.Errorf("expected StatusSuccess, got %s", result.Status)
	}
}

// TestRetryStrategy_FailureAfterAllRetries verifies that all retries are
// exhausted and the last failure is returned.
func TestRetryStrategy_FailureAfterAllRetries(t *testing.T) {
	inner := &failExecutionStrategy{}
	strategy := runner.NewRetryStrategy[struct{}](2, time.Millisecond, inner)
	ctx := context.Background()

	result := strategy.Execute(ctx, &simpleTask{status: runner.StatusSuccess}, struct{}{})
	if result.Status != runner.StatusFailure {
		t.Errorf("expected StatusFailure, got %s", result.Status)
	}
}

// TestRetryStrategy_ContextCancellationDuringBackoff verifies that context
// cancellation during the backoff delay causes a StatusCancelled result.
func TestRetryStrategy_ContextCancellationDuringBackoff(t *testing.T) {
	inner := &failExecutionStrategy{}
	// Use a long backoff so the cancellation fires during sleep.
	strategy := runner.NewRetryStrategy[struct{}](1, 1*time.Hour, inner)

	ctx, cancel := context.WithCancel(context.Background())

	// Cancel context after a short delay so the first attempt fails and we
	// enter the backoff phase before cancellation.
	go func() {
		time.Sleep(10 * time.Millisecond)
		cancel()
	}()

	result := strategy.Execute(ctx, &simpleTask{status: runner.StatusSuccess}, struct{}{})
	if result.Status != runner.StatusCancelled {
		t.Errorf("expected StatusCancelled during backoff, got %s", result.Status)
	}
}

// TestRetryStrategy_ContextCancellationBeforeAttempt verifies that context
// cancellation before a retry attempt produces a StatusCancelled.
func TestRetryStrategy_ContextCancellationBeforeAttempt(t *testing.T) {
	inner := &failExecutionStrategy{}
	strategy := runner.NewRetryStrategy[struct{}](2, 0, inner)

	ctx, cancel := context.WithCancel(context.Background())
	cancel() // cancel immediately

	result := strategy.Execute(ctx, &simpleTask{status: runner.StatusSuccess}, struct{}{})
	if result.Status != runner.StatusCancelled {
		t.Errorf("expected StatusCancelled, got %s", result.Status)
	}
}

// TestNewRetryStrategy verifies that NewRetryStrategy returns a non-nil value.
func TestNewRetryStrategy(t *testing.T) {
	inner := &failExecutionStrategy{}
	strategy := runner.NewRetryStrategy[struct{}](0, 0, inner)
	if strategy == nil {
		t.Fatal("expected non-nil RetryStrategy")
	}
}
