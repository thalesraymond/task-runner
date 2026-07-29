package main

import (
	"context"
	"testing"
	"time"

	"github.com/thalesraymond/task-runner/go/internal/runner"
)

// TestSimpleTask_Run_Success tests that simpleTask.Run returns StatusSuccess
// after the configured delay.
func TestSimpleTask_Run_Success(t *testing.T) {
	task := &simpleTask{id: "test", delay: 0}
	ctx := context.Background()
	result := task.Run(ctx, struct{}{})
	if result.Status != runner.StatusSuccess {
		t.Errorf("expected StatusSuccess, got %s", result.Status)
	}
}

// TestSimpleTask_Run_Cancellation tests that simpleTask.Run returns
// StatusCancelled when the context is cancelled.
func TestSimpleTask_Run_Cancellation(t *testing.T) {
	task := &simpleTask{id: "test", delay: 1 * time.Hour}
	ctx, cancel := context.WithCancel(context.Background())
	cancel() // cancel immediately
	result := task.Run(ctx, struct{}{})
	if result.Status != runner.StatusCancelled {
		t.Errorf("expected StatusCancelled, got %s", result.Status)
	}
}
