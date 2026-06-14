package runner_test

import (
	"context"
	"errors"
	"testing"

	"github.com/thalesraymond/task-runner/go/internal/runner"
)

// successTask is a minimal Task[T] implementation used to verify the interface contract.
type successTask[T any] struct{}

func (st *successTask[T]) Run(_ context.Context, _ T) runner.TaskResult {
	return runner.TaskResult{Status: runner.StatusSuccess}
}

// failureTask always returns a failure result with an error.
type failureTask[T any] struct{ err error }

func (ft *failureTask[T]) Run(_ context.Context, _ T) runner.TaskResult {
	return runner.TaskResult{Status: runner.StatusFailure, Err: ft.err}
}

// cancelTask honours context cancellation and returns StatusCancelled.
type cancelTask[T any] struct{}

func (ct *cancelTask[T]) Run(ctx context.Context, _ T) runner.TaskResult {
	select {
	case <-ctx.Done():
		return runner.TaskResult{Status: runner.StatusCancelled, Err: ctx.Err()}
	default:
		return runner.TaskResult{Status: runner.StatusSuccess}
	}
}

func TestTaskResult_DefaultStatus(t *testing.T) {
	var result runner.TaskResult
	if result.Status != runner.StatusSuccess {
		t.Errorf("zero-value TaskResult.Status should be StatusSuccess, got %v", result.Status)
	}
}

func TestTaskResult_ErrorField(t *testing.T) {
	sentinel := errors.New("something went wrong")
	result := runner.TaskResult{Status: runner.StatusFailure, Err: sentinel}

	if !errors.Is(result.Err, sentinel) {
		t.Errorf("expected Err to wrap sentinel, got %v", result.Err)
	}
}

func TestTask_SuccessImplementation(t *testing.T) {
	type sharedCtx struct{ value int }

	task := &successTask[sharedCtx]{}
	result := task.Run(context.Background(), sharedCtx{value: 42})

	if result.Status != runner.StatusSuccess {
		t.Errorf("expected StatusSuccess, got %v", result.Status)
	}
	if result.Err != nil {
		t.Errorf("expected nil Err, got %v", result.Err)
	}
}

func TestTask_FailureImplementation(t *testing.T) {
	type sharedCtx struct{}
	sentinel := errors.New("task failed")

	task := &failureTask[sharedCtx]{err: sentinel}
	result := task.Run(context.Background(), sharedCtx{})

	if result.Status != runner.StatusFailure {
		t.Errorf("expected StatusFailure, got %v", result.Status)
	}
	if !errors.Is(result.Err, sentinel) {
		t.Errorf("expected Err to be sentinel, got %v", result.Err)
	}
}

func TestTask_CancellationViaContext(t *testing.T) {
	type sharedCtx struct{}

	ctx, cancel := context.WithCancel(context.Background())
	cancel() // cancel immediately before Run

	task := &cancelTask[sharedCtx]{}
	result := task.Run(ctx, sharedCtx{})

	if result.Status != runner.StatusCancelled {
		t.Errorf("expected StatusCancelled, got %v", result.Status)
	}
	if !errors.Is(result.Err, context.Canceled) {
		t.Errorf("expected Err to be context.Canceled, got %v", result.Err)
	}
}

func TestTask_InterfaceConstraint(t *testing.T) {
	// Compile-time assertion: successTask must satisfy Task[struct{}].
	// If the interface is not satisfied, this assignment will not compile.
	var _ runner.Task[struct{}] = &successTask[struct{}]{}
	var _ runner.Task[struct{}] = &failureTask[struct{}]{err: nil}
	var _ runner.Task[struct{}] = &cancelTask[struct{}]{}
}
