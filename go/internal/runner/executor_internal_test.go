package runner

import (
	"context"
	"errors"
	"testing"
)

// testTask is a test double that returns a fixed result.
type testTask struct {
	status TaskStatus
	err    error
}

func (t *testTask) Run(_ context.Context, _ struct{}) TaskResult {
	return TaskResult{Status: t.status, Err: t.err}
}

// TestHandleResult_AlreadyCompleted verifies the guard clause in handleResult
// that returns early when a task is already completed (via cascade).
func TestHandleResult_AlreadyCompleted(t *testing.T) {
	graph := &TaskGraph{
		Tasks: []TaskDefinition{
			{ID: "A"},
		},
	}
	sm := NewTaskStateManager(graph)
	dispatcher := NewEventDispatcher()
	defer dispatcher.Shutdown()

	executor := NewWorkflowExecutor[struct{}](
		sm,
		map[string]Task[struct{}]{"A": &testTask{status: StatusSuccess}},
		struct{}{},
		1,
		dispatcher,
	)

	// Mark A as completed first
	sm.MarkCompleted("A", TaskResult{Status: StatusSuccess})

	// Call handleResult - should hit the guard and return without overwriting
	executor.handleResult(taskCompletion{
		taskID: "A",
		result: TaskResult{Status: StatusFailure, Err: errors.New("should be ignored")},
	})

	result, ok := sm.GetResult("A")
	if !ok {
		t.Fatal("expected result for A")
	}
	if result.Status != StatusSuccess {
		t.Errorf("expected StatusSuccess (unchanged), got %s", result.Status)
	}
}

// TestRunTask_MarkRunningFails verifies runTask's error path when MarkRunning
// fails because the task was already cascade-skipped while waiting on semaphore.
func TestRunTask_MarkRunningFails(t *testing.T) {
	// Create a graph: X -> Z (Z depends on X)
	graph := &TaskGraph{
		Tasks: []TaskDefinition{
			{ID: "X"},
			{ID: "Z", Dependencies: []string{"X"}},
		},
	}
	sm := NewTaskStateManager(graph)
	dispatcher := NewEventDispatcher()
	defer dispatcher.Shutdown()

	executor := NewWorkflowExecutor[struct{}](
		sm,
		map[string]Task[struct{}]{
			"X": &testTask{status: StatusSuccess},
			"Z": &testTask{status: StatusSuccess},
		},
		struct{}{},
		1,
		dispatcher,
	)

	// Pre-condition: Mark Z as already completed (as if cascade-skipped)
	sm.MarkCompleted("Z", TaskResult{Status: StatusSkipped})

	semaphore := make(chan struct{}, 1)
	results := make(chan taskCompletion, 1)

	// This should exit via the MarkRunning error path and send the
	// existing result (StatusSkipped).
	executor.runTask(context.Background(), "Z", semaphore, results)

	completion := <-results
	if completion.result.Status != StatusSkipped {
		t.Errorf("expected StatusSkipped, got %s", completion.result.Status)
	}
	if completion.taskID != "Z" {
		t.Errorf("expected taskID Z, got %s", completion.taskID)
	}
}

// TestRunTask_MarkRunningFails_NoResult verifies runTask's error path when
// MarkRunning fails and no result exists for the task yet (e.g. the task was
// marked Running but not Completed). In this case runTask should report
// StatusCancelled as a fallback.
func TestRunTask_MarkRunningFails_NoResult(t *testing.T) {
	graph := &TaskGraph{
		Tasks: []TaskDefinition{
			{ID: "A"},
		},
	}
	sm := NewTaskStateManager(graph)
	dispatcher := NewEventDispatcher()
	defer dispatcher.Shutdown()

	executor := NewWorkflowExecutor[struct{}](
		sm,
		map[string]Task[struct{}]{"A": &testTask{status: StatusSuccess}},
		struct{}{},
		1,
		dispatcher,
	)

	// Put A into Running state (no result yet).
	if err := sm.MarkRunning("A"); err != nil {
		t.Fatalf("failed to mark A running: %v", err)
	}

	semaphore := make(chan struct{}, 1)
	results := make(chan taskCompletion, 1)

	// Call runTask again on A. MarkRunning will fail because A is already
	// Running, and GetResult will return ok=false (no result yet).
	executor.runTask(context.Background(), "A", semaphore, results)

	completion := <-results
	if completion.result.Status != StatusCancelled {
		t.Errorf("expected StatusCancelled fallback, got %s", completion.result.Status)
	}
	if completion.taskID != "A" {
		t.Errorf("expected taskID A, got %s", completion.taskID)
	}
}

// TestWorkflowExecutor_NegativeConcurrency tests that negative concurrency
// defaults to len(tasks).
func TestWorkflowExecutor_NegativeConcurrency(t *testing.T) {
	graph := &TaskGraph{
		Tasks: []TaskDefinition{
			{ID: "A"},
			{ID: "B"},
		},
	}
	sm := NewTaskStateManager(graph)
	dispatcher := NewEventDispatcher()
	defer dispatcher.Shutdown()

	executor := NewWorkflowExecutor[struct{}](
		sm,
		map[string]Task[struct{}]{
			"A": &testTask{status: StatusSuccess},
			"B": &testTask{status: StatusSuccess},
		},
		struct{}{},
		-1, // negative, should default to len(tasks)=2
		dispatcher,
	)

	err := executor.Execute(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}
