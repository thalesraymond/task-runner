package runner_test

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/thalesraymond/task-runner/go/internal/runner"
)

// concurrencyTracker tracks the number of tasks running concurrently and
// records the peak concurrency observed.
type concurrencyTracker struct {
	mu    sync.Mutex
	count int
	max   int
}

func (ct *concurrencyTracker) inc() {
	ct.mu.Lock()
	defer ct.mu.Unlock()
	ct.count++
	if ct.count > ct.max {
		ct.max = ct.count
	}
}

func (ct *concurrencyTracker) dec() {
	ct.mu.Lock()
	defer ct.mu.Unlock()
	ct.count--
}

// trackedTask reports its running state to a concurrencyTracker and simulates
// work with a configurable delay.
type trackedTask struct {
	tracker *concurrencyTracker
	delay   time.Duration
}

func (t *trackedTask) Run(ctx context.Context, _ struct{}) runner.TaskResult {
	t.tracker.inc()
	defer t.tracker.dec()

	select {
	case <-time.After(t.delay):
		return runner.TaskResult{Status: runner.StatusSuccess}
	case <-ctx.Done():
		return runner.TaskResult{Status: runner.StatusCancelled, Err: ctx.Err()}
	}
}

// blockingTask blocks until the context is cancelled, used for testing
// cancellation behaviour.
type blockingTask struct{}

func (t *blockingTask) Run(ctx context.Context, _ struct{}) runner.TaskResult {
	<-ctx.Done()
	return runner.TaskResult{Status: runner.StatusCancelled, Err: ctx.Err()}
}

// simpleTask returns a fixed result without any real work.
type simpleTask struct {
	status runner.TaskStatus
	err    error
}

func (t *simpleTask) Run(_ context.Context, _ struct{}) runner.TaskResult {
	return runner.TaskResult{Status: t.status, Err: t.err}
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

func TestNewWorkflowExecutor(t *testing.T) {
	dispatcher := runner.NewEventDispatcher()
	defer dispatcher.Shutdown()

	executor := runner.NewWorkflowExecutor[struct{}](
		runner.NewTaskStateManager(nil),
		map[string]runner.Task[struct{}]{},
		struct{}{},
		5,
		dispatcher,
	)

	if executor == nil {
		t.Fatal("expected non-nil WorkflowExecutor")
	}
}

func TestWorkflowExecutor_EmptyGraph(t *testing.T) {
	dispatcher := runner.NewEventDispatcher()
	defer dispatcher.Shutdown()

	executor := runner.NewWorkflowExecutor[struct{}](
		runner.NewTaskStateManager(nil),
		map[string]runner.Task[struct{}]{},
		struct{}{},
		5,
		dispatcher,
	)

	ctx := context.Background()
	err := executor.Execute(ctx)
	if err != nil {
		t.Fatalf("expected nil for empty graph, got %v", err)
	}
}

func TestWorkflowExecutor_AllSuccess(t *testing.T) {
	graph := &runner.TaskGraph{
		Tasks: []runner.TaskDefinition{
			{ID: "A"},
			{ID: "B"},
			{ID: "C"},
		},
	}

	if err := runner.Validate(graph); err != nil {
		t.Fatal(err)
	}

	tasks := make(map[string]runner.Task[struct{}])
	tasks["A"] = &simpleTask{status: runner.StatusSuccess}
	tasks["B"] = &simpleTask{status: runner.StatusSuccess}
	tasks["C"] = &simpleTask{status: runner.StatusSuccess}

	stateManager := runner.NewTaskStateManager(graph)
	dispatcher := runner.NewEventDispatcher()
	defer dispatcher.Shutdown()

	executor := runner.NewWorkflowExecutor(
		stateManager, tasks, struct{}{}, 3, dispatcher,
	)

	err := executor.Execute(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	for _, id := range []string{"A", "B", "C"} {
		result, ok := stateManager.GetResult(id)
		if !ok {
			t.Errorf("expected result for %s", id)
		} else if result.Status != runner.StatusSuccess {
			t.Errorf("expected %s to be StatusSuccess, got %s", id, result.Status)
		}
	}
}

func TestWorkflowExecutor_ConcurrencyLimit(t *testing.T) {
	const numTasks = 12
	const maxConcurrent = 3

	tracker := &concurrencyTracker{}
	tasks := make(map[string]runner.Task[struct{}])
	graph := &runner.TaskGraph{}

	for i := 0; i < numTasks; i++ {
		id := fmt.Sprintf("task%d", i)
		graph.Tasks = append(graph.Tasks, runner.TaskDefinition{ID: id})
		tasks[id] = &trackedTask{tracker: tracker, delay: 100 * time.Millisecond}
	}

	if err := runner.Validate(graph); err != nil {
		t.Fatal(err)
	}

	stateManager := runner.NewTaskStateManager(graph)
	dispatcher := runner.NewEventDispatcher()
	defer dispatcher.Shutdown()

	executor := runner.NewWorkflowExecutor(
		stateManager, tasks, struct{}{}, maxConcurrent, dispatcher,
	)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err := executor.Execute(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if tracker.max > maxConcurrent {
		t.Errorf("expected max concurrent <= %d, got %d", maxConcurrent, tracker.max)
	}
	if tracker.max == 0 {
		t.Error("expected at least some concurrency, got max=0")
	}
}

func TestWorkflowExecutor_Cancellation(t *testing.T) {
	graph := &runner.TaskGraph{}
	tasks := make(map[string]runner.Task[struct{}])

	for i := 0; i < 5; i++ {
		id := fmt.Sprintf("blocker%d", i)
		graph.Tasks = append(graph.Tasks, runner.TaskDefinition{ID: id})
		tasks[id] = &blockingTask{}
	}

	if err := runner.Validate(graph); err != nil {
		t.Fatal(err)
	}

	stateManager := runner.NewTaskStateManager(graph)
	dispatcher := runner.NewEventDispatcher()
	defer dispatcher.Shutdown()

	executor := runner.NewWorkflowExecutor(
		stateManager, tasks, struct{}{}, 3, dispatcher,
	)

	ctx, cancel := context.WithCancel(context.Background())

	errCh := make(chan error, 1)
	go func() {
		errCh <- executor.Execute(ctx)
	}()

	// Give tasks a moment to start running.
	time.Sleep(50 * time.Millisecond)

	// Cancel the context — executor should exit promptly.
	cancel()

	select {
	case err := <-errCh:
		if err != context.Canceled {
			t.Errorf("expected context.Canceled, got %v", err)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("executor did not exit promptly after cancellation")
	}
}

func TestWorkflowExecutor_TaskFailure(t *testing.T) {
	graph := &runner.TaskGraph{
		Tasks: []runner.TaskDefinition{
			{ID: "A"},
			{ID: "B", Dependencies: []string{"A"}},
			{ID: "C", Dependencies: []string{"A"}},
			{ID: "D", Dependencies: []string{"B"}},
		},
	}

	if err := runner.Validate(graph); err != nil {
		t.Fatal(err)
	}

	tasks := make(map[string]runner.Task[struct{}])
	tasks["A"] = &simpleTask{status: runner.StatusFailure, err: errors.New("A failed")}
	tasks["B"] = &simpleTask{status: runner.StatusSuccess}
	tasks["C"] = &simpleTask{status: runner.StatusSuccess}
	tasks["D"] = &simpleTask{status: runner.StatusSuccess}

	stateManager := runner.NewTaskStateManager(graph)
	dispatcher := runner.NewEventDispatcher()
	defer dispatcher.Shutdown()

	executor := runner.NewWorkflowExecutor(
		stateManager, tasks, struct{}{}, 3, dispatcher,
	)

	err := executor.Execute(context.Background())
	if err == nil {
		t.Fatal("expected error due to task failure")
	}

	// A should be failed.
	resultA, _ := stateManager.GetResult("A")
	if resultA.Status != runner.StatusFailure {
		t.Errorf("expected A to be StatusFailure, got %s", resultA.Status)
	}

	// B, C, D should be skipped (cascade from A via MarkDependencyFailed).
	for _, id := range []string{"B", "C", "D"} {
		result, ok := stateManager.GetResult(id)
		if !ok {
			t.Errorf("expected result for %s", id)
		} else if result.Status != runner.StatusSkipped {
			t.Errorf("expected %s to be StatusSkipped, got %s", id, result.Status)
		}
	}
}

func TestWorkflowExecutor_DependencyOrder(t *testing.T) {
	graph := &runner.TaskGraph{
		Tasks: []runner.TaskDefinition{
			{ID: "A"},
			{ID: "B", Dependencies: []string{"A"}},
			{ID: "C", Dependencies: []string{"A"}},
		},
	}

	if err := runner.Validate(graph); err != nil {
		t.Fatal(err)
	}

	tasks := make(map[string]runner.Task[struct{}])
	tasks["A"] = &simpleTask{status: runner.StatusSuccess}
	tasks["B"] = &simpleTask{status: runner.StatusSuccess}
	tasks["C"] = &simpleTask{status: runner.StatusSuccess}

	stateManager := runner.NewTaskStateManager(graph)
	dispatcher := runner.NewEventDispatcher()
	defer dispatcher.Shutdown()

	executor := runner.NewWorkflowExecutor(
		stateManager, tasks, struct{}{}, 3, dispatcher,
	)

	err := executor.Execute(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// A should have completed successfully.
	resultA, _ := stateManager.GetResult("A")
	if resultA.Status != runner.StatusSuccess {
		t.Errorf("expected A to be StatusSuccess, got %s", resultA.Status)
	}

	// B and C should also have completed.
	resultB, _ := stateManager.GetResult("B")
	if resultB.Status != runner.StatusSuccess {
		t.Errorf("expected B to be StatusSuccess, got %s", resultB.Status)
	}
	resultC, _ := stateManager.GetResult("C")
	if resultC.Status != runner.StatusSuccess {
		t.Errorf("expected C to be StatusSuccess, got %s", resultC.Status)
	}
}

func TestWorkflowExecutor_MaxConcurrentZeroDefault(t *testing.T) {
	graph := &runner.TaskGraph{
		Tasks: []runner.TaskDefinition{
			{ID: "X"},
			{ID: "Y"},
		},
	}

	tasks := make(map[string]runner.Task[struct{}])
	tasks["X"] = &simpleTask{status: runner.StatusSuccess}
	tasks["Y"] = &simpleTask{status: runner.StatusSuccess}

	stateManager := runner.NewTaskStateManager(graph)
	dispatcher := runner.NewEventDispatcher()
	defer dispatcher.Shutdown()

	// maxConcurrent = 0 should default to len(tasks) = 2.
	executor := runner.NewWorkflowExecutor(
		stateManager, tasks, struct{}{}, 0, dispatcher,
	)

	err := executor.Execute(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}
