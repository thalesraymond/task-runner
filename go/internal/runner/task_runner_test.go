package runner_test

import (
	"context"
	"errors"
	"testing"

	"github.com/thalesraymond/task-runner/go/internal/runner"
)

// testPlugin implements runner.WorkflowStartListener to track calls.
type testPlugin struct {
	workflowStarted bool
}

func (p *testPlugin) OnWorkflowStart(_ context.Context, _ runner.WorkflowStartEvent) {
	p.workflowStarted = true
}

// callTrackingStrategy wraps another strategy and tracks how many times
// Execute was called.
type callTrackingStrategy[T any] struct {
	callCount int
	inner     runner.ExecutionStrategy[T]
}

func (s *callTrackingStrategy[T]) Execute(ctx context.Context, task runner.Task[T], sharedState T) runner.TaskResult {
	s.callCount++
	return s.inner.Execute(ctx, task, sharedState)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func simpleGraph() *runner.TaskGraph {
	return &runner.TaskGraph{
		Tasks: []runner.TaskDefinition{
			{ID: "task1"},
			{ID: "task2", Dependencies: []string{"task1"}},
		},
	}
}

func simpleTasks() map[string]runner.Task[struct{}] {
	return map[string]runner.Task[struct{}]{
		"task1": &successTask[struct{}]{},
		"task2": &successTask[struct{}]{},
	}
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

func TestNewTaskRunner_Defaults(t *testing.T) {
	tr := runner.NewTaskRunner[struct{}]()
	if tr == nil {
		t.Fatal("expected non-nil TaskRunner")
	}
}

func TestNewTaskRunner_WithConcurrency(t *testing.T) {
	tr := runner.NewTaskRunner[struct{}](runner.WithConcurrency(5))
	if tr == nil {
		t.Fatal("expected non-nil TaskRunner")
	}

	ctx := context.Background()
	graph := simpleGraph()
	tasks := simpleTasks()

	err := tr.Execute(ctx, graph, tasks, struct{}{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestNewTaskRunner_WithPlugin(t *testing.T) {
	plugin := &testPlugin{}
	tr := runner.NewTaskRunner[struct{}](runner.WithPlugin(plugin))
	if tr == nil {
		t.Fatal("expected non-nil TaskRunner")
	}

	ctx := context.Background()
	graph := simpleGraph()
	tasks := simpleTasks()

	err := tr.Execute(ctx, graph, tasks, struct{}{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if !plugin.workflowStarted {
		t.Error("expected plugin.OnWorkflowStart to have been called")
	}
}

func TestTaskRunner_Execute_InvalidGraph(t *testing.T) {
	tr := runner.NewTaskRunner[struct{}]()

	// Graph with a missing dependency — should fail validation.
	graph := &runner.TaskGraph{
		Tasks: []runner.TaskDefinition{
			{ID: "task1", Dependencies: []string{"nonexistent"}},
		},
	}
	tasks := simpleTasks()

	ctx := context.Background()
	err := tr.Execute(ctx, graph, tasks, struct{}{})
	if err == nil {
		t.Fatal("expected validation error for missing dependency")
	}

	var missingErr *runner.MissingDependencyError
	if !errors.As(err, &missingErr) {
		t.Errorf("expected MissingDependencyError, got %T: %v", err, err)
	}
	if missingErr.TaskID != "task1" {
		t.Errorf("expected TaskID 'task1', got %q", missingErr.TaskID)
	}
	if missingErr.MissingDependencyID != "nonexistent" {
		t.Errorf("expected MissingDependencyID 'nonexistent', got %q", missingErr.MissingDependencyID)
	}
}

func TestTaskRunner_Execute_Success(t *testing.T) {
	tr := runner.NewTaskRunner[struct{}]()

	ctx := context.Background()
	graph := simpleGraph()
	tasks := simpleTasks()

	err := tr.Execute(ctx, graph, tasks, struct{}{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestTaskRunner_Execute_Failure(t *testing.T) {
	tr := runner.NewTaskRunner[struct{}]()

	graph := &runner.TaskGraph{
		Tasks: []runner.TaskDefinition{
			{ID: "failTask"},
		},
	}
	tasks := map[string]runner.Task[struct{}]{
		"failTask": &failureTask[struct{}]{err: errors.New("task failed")},
	}

	ctx := context.Background()
	err := tr.Execute(ctx, graph, tasks, struct{}{})
	if err == nil {
		t.Fatal("expected error due to task failure")
	}
}

func TestTaskRunner_SetStrategy(t *testing.T) {
	tracker := &callTrackingStrategy[struct{}]{
		inner: &runner.StandardStrategy[struct{}]{},
	}

	tr := runner.NewTaskRunner[struct{}]()
	tr.SetStrategy(tracker)

	ctx := context.Background()
	graph := simpleGraph()
	tasks := simpleTasks()

	err := tr.Execute(ctx, graph, tasks, struct{}{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if tracker.callCount != len(tasks) {
		t.Errorf("expected %d strategy calls, got %d", len(tasks), tracker.callCount)
	}
}
