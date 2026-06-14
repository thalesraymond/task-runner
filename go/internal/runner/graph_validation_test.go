package runner

import (
	"errors"
	"testing"
)

func TestValidate_ValidGraph(t *testing.T) {
	graph := &TaskGraph{
		Tasks: []TaskDefinition{
			{ID: "A", Dependencies: []string{}},
			{ID: "B", Dependencies: []string{"A"}},
			{ID: "C", Dependencies: []string{"A"}},
			{ID: "D", Dependencies: []string{"B", "C"}},
		},
	}

	err := Validate(graph)
	if err != nil {
		t.Fatalf("expected valid graph, got error: %v", err)
	}
}

func TestValidate_DuplicateIDs(t *testing.T) {
	graph := &TaskGraph{
		Tasks: []TaskDefinition{
			{ID: "A"},
			{ID: "B", Dependencies: []string{"A"}},
			{ID: "A"},
		},
	}

	err := Validate(graph)
	if err == nil {
		t.Fatalf("expected error, got nil")
	}

	var dupErr *DuplicateTaskError
	if !errors.As(err, &dupErr) {
		t.Fatalf("expected *DuplicateTaskError, got: %T", err)
	}
	if dupErr.TaskID != "A" {
		t.Errorf("expected duplicate TaskID 'A', got '%s'", dupErr.TaskID)
	}
}

func TestValidate_MissingDependencies(t *testing.T) {
	graph := &TaskGraph{
		Tasks: []TaskDefinition{
			{ID: "A", Dependencies: []string{"B"}},
			{ID: "C", Dependencies: []string{"D"}},
		},
	}

	err := Validate(graph)
	if err == nil {
		t.Fatalf("expected error, got nil")
	}

	var missingErr *MissingDependencyError
	if !errors.As(err, &missingErr) {
		t.Fatalf("expected *MissingDependencyError, got: %v", err)
	}
	
	// Could match either A->B or C->D
	if missingErr.TaskID != "A" && missingErr.TaskID != "C" {
		t.Errorf("unexpected TaskID in error: %s", missingErr.TaskID)
	}
}

func TestValidate_Cycle(t *testing.T) {
	graph := &TaskGraph{
		Tasks: []TaskDefinition{
			{ID: "A", Dependencies: []string{"B"}},
			{ID: "B", Dependencies: []string{"C"}},
			{ID: "C", Dependencies: []string{"A"}},
			{ID: "D", Dependencies: []string{}}, // disconnected
		},
	}

	err := Validate(graph)
	if err == nil {
		t.Fatalf("expected error, got nil")
	}

	var cycleErr *CycleError
	if !errors.As(err, &cycleErr) {
		t.Fatalf("expected *CycleError, got: %v", err)
	}

	// The cycle path could be A->B->C->A, B->C->A->B, or C->A->B->C
	if len(cycleErr.CyclePath) != 4 {
		t.Errorf("expected cycle path of length 4, got %d", len(cycleErr.CyclePath))
	}
	if cycleErr.CyclePath[0] != cycleErr.CyclePath[3] {
		t.Errorf("cycle start and end should match: %v", cycleErr.CyclePath)
	}
}

func TestValidate_SelfCycle(t *testing.T) {
	graph := &TaskGraph{
		Tasks: []TaskDefinition{
			{ID: "A", Dependencies: []string{"A"}},
		},
	}

	err := Validate(graph)
	if err == nil {
		t.Fatalf("expected error, got nil")
	}

	var cycleErr *CycleError
	if !errors.As(err, &cycleErr) {
		t.Fatalf("expected *CycleError, got: %v", err)
	}

	if len(cycleErr.CyclePath) != 2 || cycleErr.CyclePath[0] != "A" || cycleErr.CyclePath[1] != "A" {
		t.Errorf("expected A -> A cycle, got %v", cycleErr.CyclePath)
	}
}
