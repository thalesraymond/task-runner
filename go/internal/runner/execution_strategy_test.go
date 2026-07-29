package runner_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/thalesraymond/task-runner/go/internal/runner"
)

// testTask is a simple task implementation for testing strategies.
type testTask struct {
	runFn func(ctx context.Context) runner.TaskResult
}

func (t *testTask) Run(ctx context.Context, _ struct{}) runner.TaskResult {
	return t.runFn(ctx)
}

// retryTracker counts how many times a task has been called.
type retryTracker struct {
	count int
}

func TestStandardStrategy_Success(t *testing.T) {
	task := &testTask{
		runFn: func(_ context.Context) runner.TaskResult {
			return runner.TaskResult{Status: runner.StatusSuccess}
		},
	}
	strategy := &runner.StandardStrategy[struct{}]{}
	result := strategy.Execute(context.Background(), task, struct{}{})
	if result.Status != runner.StatusSuccess {
		t.Errorf("expected StatusSuccess, got %v", result.Status)
	}
	if result.Err != nil {
		t.Errorf("expected nil error, got %v", result.Err)
	}
}

func TestStandardStrategy_Failure(t *testing.T) {
	expectedErr := errors.New("task failed")
	task := &testTask{
		runFn: func(_ context.Context) runner.TaskResult {
			return runner.TaskResult{Status: runner.StatusFailure, Err: expectedErr}
		},
	}
	strategy := &runner.StandardStrategy[struct{}]{}
	result := strategy.Execute(context.Background(), task, struct{}{})
	if result.Status != runner.StatusFailure {
		t.Errorf("expected StatusFailure, got %v", result.Status)
	}
	if !errors.Is(result.Err, expectedErr) {
		t.Errorf("expected error %v, got %v", expectedErr, result.Err)
	}
}

func TestRetryStrategy_EventuallySucceeds(t *testing.T) {
	tracker := &retryTracker{}
	task := &testTask{
		runFn: func(_ context.Context) runner.TaskResult {
			tracker.count++
			if tracker.count < 3 {
				return runner.TaskResult{Status: runner.StatusFailure, Err: errors.New("transient error")}
			}
			return runner.TaskResult{Status: runner.StatusSuccess}
		},
	}
	inner := &runner.StandardStrategy[struct{}]{}
	strategy := runner.NewRetryStrategy[struct{}](3, time.Millisecond, inner)
	result := strategy.Execute(context.Background(), task, struct{}{})
	if result.Status != runner.StatusSuccess {
		t.Errorf("expected StatusSuccess, got %v", result.Status)
	}
	if tracker.count != 3 {
		t.Errorf("expected 3 attempts, got %d", tracker.count)
	}
}

func TestRetryStrategy_Exhausted(t *testing.T) {
	finalErr := errors.New("final error")
	task := &testTask{
		runFn: func(_ context.Context) runner.TaskResult {
			return runner.TaskResult{Status: runner.StatusFailure, Err: finalErr}
		},
	}
	inner := &runner.StandardStrategy[struct{}]{}
	strategy := runner.NewRetryStrategy[struct{}](2, time.Millisecond, inner)
	result := strategy.Execute(context.Background(), task, struct{}{})
	if result.Status != runner.StatusFailure {
		t.Errorf("expected StatusFailure, got %v", result.Status)
	}
	if !errors.Is(result.Err, finalErr) {
		t.Errorf("expected error %v, got %v", finalErr, result.Err)
	}
}

func TestRetryStrategy_RespectsContextCancellation(t *testing.T) {
	task := &testTask{
		runFn: func(_ context.Context) runner.TaskResult {
			return runner.TaskResult{Status: runner.StatusFailure, Err: errors.New("transient error")}
		},
	}
	inner := &runner.StandardStrategy[struct{}]{}
	strategy := runner.NewRetryStrategy[struct{}](5, 100*time.Millisecond, inner)

	ctx, cancel := context.WithCancel(context.Background())
	cancel() // cancel immediately

	result := strategy.Execute(ctx, task, struct{}{})
	if result.Status != runner.StatusCancelled {
		t.Errorf("expected StatusCancelled, got %v", result.Status)
	}
}

func TestDryRunStrategy_ReturnsSuccess(t *testing.T) {
	task := &testTask{
		runFn: func(_ context.Context) runner.TaskResult {
			t.Error("DryRunStrategy should not execute the task")
			return runner.TaskResult{Status: runner.StatusFailure, Err: errors.New("should not be called")}
		},
	}
	strategy := &runner.DryRunStrategy[struct{}]{}
	result := strategy.Execute(context.Background(), task, struct{}{})
	if result.Status != runner.StatusSuccess {
		t.Errorf("expected StatusSuccess, got %v", result.Status)
	}
	if result.Err != nil {
		t.Errorf("expected nil error, got %v", result.Err)
	}
}
