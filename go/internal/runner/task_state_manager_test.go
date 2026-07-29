package runner

import (
	"errors"
	"sync"
	"testing"
)

func TestTaskStateString(t *testing.T) {
	tests := []struct {
		state    TaskState
		expected string
	}{
		{TaskStatePending, "pending"},
		{TaskStateRunning, "running"},
		{TaskStateCompleted, "completed"},
	}

	for _, tc := range tests {
		tc := tc
		t.Run(tc.expected, func(t *testing.T) {
			got := tc.state.String()
			if got != tc.expected {
				t.Errorf("TaskState(%d).String() = %q, want %q", tc.state, got, tc.expected)
			}
		})
	}
}

func TestTaskStateString_UnknownValue(t *testing.T) {
	unknown := TaskState(99)
	got := unknown.String()
	if got != "unknown" {
		t.Errorf("expected \"unknown\" for undefined state, got %q", got)
	}
}

func TestNewTaskStateManager(t *testing.T) {
	graph := &TaskGraph{
		Tasks: []TaskDefinition{
			{ID: "A", Dependencies: []string{}},
			{ID: "B", Dependencies: []string{"A"}},
			{ID: "C", Dependencies: []string{"A", "B"}},
		},
	}

	tsm := NewTaskStateManager(graph)

	// All tasks should be pending
	for _, task := range graph.Tasks {
		state, ok := tsm.GetState(task.ID)
		if !ok {
			t.Errorf("expected task %q to exist", task.ID)
		}
		if state != TaskStatePending {
			t.Errorf("expected task %q to be pending, got %s", task.ID, state)
		}
	}

	// Verify dependencies
	depsA := tsm.GetDependencies("A")
	if len(depsA) != 0 {
		t.Errorf("expected A to have no dependencies, got %v", depsA)
	}

	depsB := tsm.GetDependencies("B")
	if len(depsB) != 1 || depsB[0] != "A" {
		t.Errorf("expected B to depend on [A], got %v", depsB)
	}

	depsC := tsm.GetDependencies("C")
	if len(depsC) != 2 {
		t.Errorf("expected C to depend on 2 tasks, got %v", depsC)
	}

	// Verify dependents (reverse lookup)
	depsOfA := tsm.GetDependents("A")
	if len(depsOfA) != 2 {
		t.Errorf("expected A to have 2 dependents, got %v", depsOfA)
	}

	depsOfB := tsm.GetDependents("B")
	if len(depsOfB) != 1 || depsOfB[0] != "C" {
		t.Errorf("expected B to have dependent [C], got %v", depsOfB)
	}

	depsOfC := tsm.GetDependents("C")
	if len(depsOfC) != 0 {
		t.Errorf("expected C to have no dependents, got %v", depsOfC)
	}
}

func TestNewTaskStateManager_NilGraph(t *testing.T) {
	tsm := NewTaskStateManager(nil)
	if tsm == nil {
		t.Fatal("expected non-nil TaskStateManager")
	}

	state, ok := tsm.GetState("nonexistent")
	if ok {
		t.Error("expected nonexistent task to not be found")
	}
	if state != TaskStatePending {
		t.Errorf("expected zero value TaskStatePending, got %s", state)
	}
}

func TestGetState(t *testing.T) {
	graph := &TaskGraph{
		Tasks: []TaskDefinition{{ID: "A"}},
	}
	tsm := NewTaskStateManager(graph)

	t.Run("existing task", func(t *testing.T) {
		state, ok := tsm.GetState("A")
		if !ok {
			t.Error("expected task A to exist")
		}
		if state != TaskStatePending {
			t.Errorf("expected pending, got %s", state)
		}
	})

	t.Run("non-existing task", func(t *testing.T) {
		state, ok := tsm.GetState("Z")
		if ok {
			t.Error("expected task Z to not exist")
		}
		if state != TaskStatePending {
			t.Errorf("expected zero value TaskStatePending, got %s", state)
		}
	})
}

func TestGetDependencies(t *testing.T) {
	graph := &TaskGraph{
		Tasks: []TaskDefinition{
			{ID: "A"},
			{ID: "B", Dependencies: []string{"A"}},
		},
	}
	tsm := NewTaskStateManager(graph)

	t.Run("existing task with deps", func(t *testing.T) {
		deps := tsm.GetDependencies("B")
		if len(deps) != 1 || deps[0] != "A" {
			t.Errorf("expected [A], got %v", deps)
		}
	})

	t.Run("existing task without deps", func(t *testing.T) {
		deps := tsm.GetDependencies("A")
		if len(deps) != 0 {
			t.Errorf("expected empty slice, got %v", deps)
		}
	})

	t.Run("non-existing task", func(t *testing.T) {
		deps := tsm.GetDependencies("Z")
		if deps != nil {
			t.Errorf("expected nil for non-existing task, got %v", deps)
		}
	})
}

func TestGetDependents(t *testing.T) {
	graph := &TaskGraph{
		Tasks: []TaskDefinition{
			{ID: "A"},
			{ID: "B", Dependencies: []string{"A"}},
		},
	}
	tsm := NewTaskStateManager(graph)

	t.Run("existing task with dependents", func(t *testing.T) {
		deps := tsm.GetDependents("A")
		if len(deps) != 1 || deps[0] != "B" {
			t.Errorf("expected [B], got %v", deps)
		}
	})

	t.Run("existing task without dependents", func(t *testing.T) {
		deps := tsm.GetDependents("B")
		if len(deps) != 0 {
			t.Errorf("expected empty slice, got %v", deps)
		}
	})

	t.Run("non-existing task", func(t *testing.T) {
		deps := tsm.GetDependents("Z")
		if deps != nil {
			t.Errorf("expected nil for non-existing task, got %v", deps)
		}
	})
}

func TestMarkRunning(t *testing.T) {
	t.Run("successful transition", func(t *testing.T) {
		tsm := NewTaskStateManager(&TaskGraph{
			Tasks: []TaskDefinition{{ID: "A"}},
		})
		err := tsm.MarkRunning("A")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		state, _ := tsm.GetState("A")
		if state != TaskStateRunning {
			t.Errorf("expected running, got %s", state)
		}
	})

	t.Run("non-existing task", func(t *testing.T) {
		tsm := NewTaskStateManager(&TaskGraph{})
		err := tsm.MarkRunning("Z")
		if err == nil {
			t.Fatal("expected error for non-existing task")
		}
	})

	t.Run("non-pending task", func(t *testing.T) {
		tsm := NewTaskStateManager(&TaskGraph{
			Tasks: []TaskDefinition{{ID: "A"}},
		})
		_ = tsm.MarkRunning("A")
		err := tsm.MarkRunning("A")
		if err == nil {
			t.Fatal("expected error for non-pending task")
		}
	})
}

func TestMarkCompleted(t *testing.T) {
	t.Run("successful completion from running", func(t *testing.T) {
		tsm := NewTaskStateManager(&TaskGraph{
			Tasks: []TaskDefinition{{ID: "A"}},
		})
		_ = tsm.MarkRunning("A")
		err := tsm.MarkCompleted("A", TaskResult{Status: StatusSuccess})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		state, _ := tsm.GetState("A")
		if state != TaskStateCompleted {
			t.Errorf("expected completed, got %s", state)
		}
		result, ok := tsm.GetResult("A")
		if !ok {
			t.Fatal("expected result to exist")
		}
		if result.Status != StatusSuccess {
			t.Errorf("expected success, got %s", result.Status)
		}
	})

	t.Run("completion from pending (skipped path)", func(t *testing.T) {
		tsm := NewTaskStateManager(&TaskGraph{
			Tasks: []TaskDefinition{{ID: "A"}},
		})
		err := tsm.MarkCompleted("A", TaskResult{Status: StatusSkipped})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		state, _ := tsm.GetState("A")
		if state != TaskStateCompleted {
			t.Errorf("expected completed, got %s", state)
		}
		result, ok := tsm.GetResult("A")
		if !ok {
			t.Fatal("expected result to exist")
		}
		if result.Status != StatusSkipped {
			t.Errorf("expected skipped, got %s", result.Status)
		}
	})

	t.Run("non-existing task", func(t *testing.T) {
		tsm := NewTaskStateManager(&TaskGraph{})
		err := tsm.MarkCompleted("Z", TaskResult{Status: StatusSuccess})
		if err == nil {
			t.Fatal("expected error for non-existing task")
		}
	})

	t.Run("already completed", func(t *testing.T) {
		tsm := NewTaskStateManager(&TaskGraph{
			Tasks: []TaskDefinition{{ID: "A"}},
		})
		_ = tsm.MarkCompleted("A", TaskResult{Status: StatusSuccess})
		err := tsm.MarkCompleted("A", TaskResult{Status: StatusSuccess})
		if err == nil {
			t.Fatal("expected error for already completed task")
		}
	})
}

func TestMarkFailed(t *testing.T) {
	tsm := NewTaskStateManager(&TaskGraph{
		Tasks: []TaskDefinition{{ID: "A"}},
	})
	_ = tsm.MarkRunning("A")
	someErr := errors.New("something went wrong")
	err := tsm.MarkFailed("A", someErr)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	state, _ := tsm.GetState("A")
	if state != TaskStateCompleted {
		t.Errorf("expected completed, got %s", state)
	}

	result, ok := tsm.GetResult("A")
	if !ok {
		t.Fatal("expected result to exist")
	}
	if result.Status != StatusFailure {
		t.Errorf("expected failure, got %s", result.Status)
	}
	if result.Err != someErr {
		t.Errorf("expected error %v, got %v", someErr, result.Err)
	}
}

func TestMarkSkipped(t *testing.T) {
	tsm := NewTaskStateManager(&TaskGraph{
		Tasks: []TaskDefinition{{ID: "A"}},
	})

	err := tsm.MarkSkipped("A")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	state, _ := tsm.GetState("A")
	if state != TaskStateCompleted {
		t.Errorf("expected completed, got %s", state)
	}

	result, ok := tsm.GetResult("A")
	if !ok {
		t.Fatal("expected result to exist")
	}
	if result.Status != StatusSkipped {
		t.Errorf("expected skipped, got %s", result.Status)
	}
}

func TestAreDependenciesMet(t *testing.T) {
	t.Run("no dependencies", func(t *testing.T) {
		graph := &TaskGraph{
			Tasks: []TaskDefinition{{ID: "A"}},
		}
		tsm := NewTaskStateManager(graph)
		if !tsm.AreDependenciesMet("A") {
			t.Error("expected deps met for task with no deps")
		}
	})

	t.Run("all deps completed successfully", func(t *testing.T) {
		graph := &TaskGraph{
			Tasks: []TaskDefinition{
				{ID: "A"},
				{ID: "B", Dependencies: []string{"A"}},
			},
		}
		tsm := NewTaskStateManager(graph)
		_ = tsm.MarkRunning("A")
		_ = tsm.MarkCompleted("A", TaskResult{Status: StatusSuccess})
		if !tsm.AreDependenciesMet("B") {
			t.Error("expected deps met for B")
		}
	})

	t.Run("dep not completed", func(t *testing.T) {
		graph := &TaskGraph{
			Tasks: []TaskDefinition{
				{ID: "A"},
				{ID: "B", Dependencies: []string{"A"}},
			},
		}
		tsm := NewTaskStateManager(graph)
		if tsm.AreDependenciesMet("B") {
			t.Error("expected deps not met when dep is pending")
		}
	})

	t.Run("dep failed", func(t *testing.T) {
		graph := &TaskGraph{
			Tasks: []TaskDefinition{
				{ID: "A"},
				{ID: "B", Dependencies: []string{"A"}},
			},
		}
		tsm := NewTaskStateManager(graph)
		_ = tsm.MarkRunning("A")
		_ = tsm.MarkFailed("A", errors.New("oops"))
		if tsm.AreDependenciesMet("B") {
			t.Error("expected deps not met when dep failed")
		}
	})

	t.Run("non-existing task", func(t *testing.T) {
		tsm := NewTaskStateManager(&TaskGraph{})
		if tsm.AreDependenciesMet("Z") {
			t.Error("expected false for non-existing task")
		}
	})
}

func TestGetResult(t *testing.T) {
	graph := &TaskGraph{
		Tasks: []TaskDefinition{{ID: "A"}},
	}
	tsm := NewTaskStateManager(graph)

	t.Run("no result yet", func(t *testing.T) {
		_, ok := tsm.GetResult("A")
		if ok {
			t.Error("expected no result for pending task")
		}
	})

	t.Run("result after completion", func(t *testing.T) {
		_ = tsm.MarkCompleted("A", TaskResult{Status: StatusSuccess})
		result, ok := tsm.GetResult("A")
		if !ok {
			t.Fatal("expected result to exist")
		}
		if result.Status != StatusSuccess {
			t.Errorf("expected success, got %s", result.Status)
		}
	})

	t.Run("non-existing task", func(t *testing.T) {
		_, ok := tsm.GetResult("Z")
		if ok {
			t.Error("expected no result for non-existing task")
		}
	})
}

func TestConcurrentStateUpdates(t *testing.T) {
	graph := &TaskGraph{
		Tasks: []TaskDefinition{
			{ID: "A"},
			{ID: "B"},
			{ID: "C"},
		},
	}
	tsm := NewTaskStateManager(graph)

	var wg sync.WaitGroup
	numGoroutines := 20

	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			// Concurrent writes
			_ = tsm.MarkRunning("A")
			_ = tsm.MarkRunning("B")
			_ = tsm.MarkCompleted("A", TaskResult{Status: StatusSuccess})
			_ = tsm.MarkCompleted("B", TaskResult{Status: StatusSuccess})
			// Concurrent reads
			tsm.GetState("A")
			tsm.GetState("B")
			tsm.GetState("C")
			tsm.GetResult("A")
			tsm.GetResult("B")
			tsm.AreDependenciesMet("A")
			tsm.GetDependencies("A")
			tsm.GetDependents("A")
		}()
	}

	wg.Wait()
}

func TestCascadingSkip(t *testing.T) {
	// Graph: A -> B -> C
	graph := &TaskGraph{
		Tasks: []TaskDefinition{
			{ID: "A"},
			{ID: "B", Dependencies: []string{"A"}},
			{ID: "C", Dependencies: []string{"B"}},
		},
	}
	tsm := NewTaskStateManager(graph)

	err := tsm.MarkRunning("A")
	if err != nil {
		t.Fatalf("failed to mark A running: %v", err)
	}

	skipped, err := tsm.MarkDependencyFailed("A", errors.New("A failed"))
	if err != nil {
		t.Fatalf("MarkDependencyFailed failed: %v", err)
	}

	// Verify A is completed with failure
	stateA, _ := tsm.GetState("A")
	if stateA != TaskStateCompleted {
		t.Errorf("expected A to be completed, got %s", stateA)
	}
	resultA, _ := tsm.GetResult("A")
	if resultA.Status != StatusFailure {
		t.Errorf("expected A to have failure status, got %s", resultA.Status)
	}

	// Verify B is skipped
	stateB, _ := tsm.GetState("B")
	if stateB != TaskStateCompleted {
		t.Errorf("expected B to be completed, got %s", stateB)
	}
	resultB, _ := tsm.GetResult("B")
	if resultB.Status != StatusSkipped {
		t.Errorf("expected B to have skipped status, got %s", resultB.Status)
	}

	// Verify C is skipped
	stateC, _ := tsm.GetState("C")
	if stateC != TaskStateCompleted {
		t.Errorf("expected C to be completed, got %s", stateC)
	}
	resultC, _ := tsm.GetResult("C")
	if resultC.Status != StatusSkipped {
		t.Errorf("expected C to have skipped status, got %s", resultC.Status)
	}

	// Verify skipped list contains B and C
	if len(skipped) != 2 {
		t.Errorf("expected 2 skipped tasks, got %d: %v", len(skipped), skipped)
	}
}

func TestCascadingSkip_DiamondGraph(t *testing.T) {
	// Diamond: A -> B, A -> C, both B and C -> D
	graph := &TaskGraph{
		Tasks: []TaskDefinition{
			{ID: "A"},
			{ID: "B", Dependencies: []string{"A"}},
			{ID: "C", Dependencies: []string{"A"}},
			{ID: "D", Dependencies: []string{"B", "C"}},
		},
	}
	tsm := NewTaskStateManager(graph)

	_ = tsm.MarkRunning("A")
	skipped, err := tsm.MarkDependencyFailed("A", errors.New("A failed"))
	if err != nil {
		t.Fatalf("MarkDependencyFailed failed: %v", err)
	}

	// B, C, and D should all be skipped
	stateB, _ := tsm.GetState("B")
	if stateB != TaskStateCompleted {
		t.Errorf("expected B to be completed, got %s", stateB)
	}
	resultB, _ := tsm.GetResult("B")
	if resultB.Status != StatusSkipped {
		t.Errorf("expected B to have skipped status, got %s", resultB.Status)
	}

	stateC, _ := tsm.GetState("C")
	if stateC != TaskStateCompleted {
		t.Errorf("expected C to be completed, got %s", stateC)
	}
	resultC, _ := tsm.GetResult("C")
	if resultC.Status != StatusSkipped {
		t.Errorf("expected C to have skipped status, got %s", resultC.Status)
	}

	stateD, _ := tsm.GetState("D")
	if stateD != TaskStateCompleted {
		t.Errorf("expected D to be completed, got %s", stateD)
	}
	resultD, _ := tsm.GetResult("D")
	if resultD.Status != StatusSkipped {
		t.Errorf("expected D to have skipped status, got %s", resultD.Status)
	}

	if len(skipped) != 3 {
		t.Errorf("expected 3 skipped tasks, got %d: %v", len(skipped), skipped)
	}
}

// TestCascadeSkip_NonExistentDependent verifies that cascadeSkip does not panic
// when a dependent listed in the dependents map does not exist in states (e.g.
// due to inconsistent data).
func TestCascadeSkip_NonExistentDependent(t *testing.T) {
	graph := &TaskGraph{
		Tasks: []TaskDefinition{
			{ID: "A"},
			{ID: "B", Dependencies: []string{"A"}},
		},
	}
	tsm := NewTaskStateManager(graph)

	// Remove B from states while keeping it in A's dependents to create
	// the inconsistent state that exercises the guard clause.
	delete(tsm.states, "B")

	_ = tsm.MarkRunning("A")
	skipped, err := tsm.MarkDependencyFailed("A", errors.New("A failed"))
	if err != nil {
		t.Fatalf("MarkDependencyFailed failed: %v", err)
	}

	// B should not be in skipped because it didn't exist in states.
	if len(skipped) != 0 {
		t.Errorf("expected 0 skipped tasks, got %d: %v", len(skipped), skipped)
	}

	// A should still be marked as failure.
	resultA, _ := tsm.GetResult("A")
	if resultA.Status != StatusFailure {
		t.Errorf("expected A to be StatusFailure, got %s", resultA.Status)
	}
}

func TestMarkDependencyFailed_AlreadyCompleted(t *testing.T) {
	graph := &TaskGraph{
		Tasks: []TaskDefinition{
			{ID: "A"},
			{ID: "B", Dependencies: []string{"A"}},
		},
	}
	tsm := NewTaskStateManager(graph)

	_ = tsm.MarkRunning("A")
	_ = tsm.MarkCompleted("A", TaskResult{Status: StatusSuccess})
	_, err := tsm.MarkDependencyFailed("A", errors.New("too late"))
	if err == nil {
		t.Error("expected error when marking already completed task as failed")
	}
}

func TestMarkDependencyFailed_NonExistent(t *testing.T) {
	tsm := NewTaskStateManager(&TaskGraph{})
	_, err := tsm.MarkDependencyFailed("Z", errors.New("nope"))
	if err == nil {
		t.Error("expected error for non-existent task")
	}
}

func TestConcurrentCascadeNoDeadlock(t *testing.T) {
	// Complex graph to stress-test concurrent operations:
	// A, B (independent roots)
	// C depends on A, D depends on B
	// E depends on C, D
	// F, G depend on E
	// H depends on F, G
	graph := &TaskGraph{
		Tasks: []TaskDefinition{
			{ID: "A"},
			{ID: "B"},
			{ID: "C", Dependencies: []string{"A"}},
			{ID: "D", Dependencies: []string{"B"}},
			{ID: "E", Dependencies: []string{"C", "D"}},
			{ID: "F", Dependencies: []string{"E"}},
			{ID: "G", Dependencies: []string{"E"}},
			{ID: "H", Dependencies: []string{"F", "G"}},
		},
	}
	tsm := NewTaskStateManager(graph)

	var wg sync.WaitGroup

	// Concurrently run various operations
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_ = tsm.MarkRunning("A")
			_ = tsm.MarkRunning("B")
			_ = tsm.MarkCompleted("A", TaskResult{Status: StatusSuccess})
			_ = tsm.MarkCompleted("B", TaskResult{Status: StatusSuccess})
		}()
	}

	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			tsm.GetState("A")
			tsm.GetState("B")
			tsm.GetState("C")
			tsm.GetResult("A")
			tsm.GetDependencies("C")
			tsm.GetDependents("A")
			tsm.AreDependenciesMet("C")
			tsm.GetDependencies("H")
			tsm.GetDependents("E")
		}()
	}

	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			// Cascade operations
			tsm.MarkDependencyFailed("A", errors.New("cascade test"))
		}()
	}

	wg.Wait()
}
