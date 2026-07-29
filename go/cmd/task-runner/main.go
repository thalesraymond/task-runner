package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/thalesraymond/task-runner/go/internal/runner"
)

func main() {
	// Define a simple task graph with three tasks where B and C depend on A.
	graph := &runner.TaskGraph{
		Tasks: []runner.TaskDefinition{
			{ID: "A", Dependencies: []string{}},
			{ID: "B", Dependencies: []string{"A"}},
			{ID: "C", Dependencies: []string{"A"}},
		},
	}

	if err := runner.Validate(graph); err != nil {
		log.Fatalf("graph validation failed: %v", err)
	}

	// Create the task state manager and the event dispatcher.
	stateManager := runner.NewTaskStateManager(graph)
	dispatcher := runner.NewEventDispatcher()
	defer dispatcher.Shutdown()

	// Build the task implementations.
	tasks := map[string]runner.Task[struct{}]{
		"A": &simpleTask{id: "A", delay: 100 * time.Millisecond},
		"B": &simpleTask{id: "B", delay: 50 * time.Millisecond},
		"C": &simpleTask{id: "C", delay: 50 * time.Millisecond},
	}

	// Create the executor with a concurrency limit of 2.
	executor := runner.NewWorkflowExecutor(
		stateManager,
		tasks,
		struct{}{},
		2,
		dispatcher,
	)

	// Run with a 5-second timeout.
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	fmt.Println("Starting workflow execution...")

	start := time.Now()
	if err := executor.Execute(ctx); err != nil {
		log.Fatalf("workflow failed: %v", err)
	}

	fmt.Printf("Workflow completed in %v\n", time.Since(start))

	// Print results.
	for _, id := range []string{"A", "B", "C"} {
		result, ok := stateManager.GetResult(id)
		if ok {
			fmt.Printf("  %s: %s", id, result.Status)
			if result.Err != nil {
				fmt.Printf(" (%v)", result.Err)
			}
			fmt.Println()
		}
	}
}

// simpleTask is a minimal task implementation used for the demo.
type simpleTask struct {
	id    string
	delay time.Duration
}

func (t *simpleTask) Run(ctx context.Context, _ struct{}) runner.TaskResult {
	select {
	case <-time.After(t.delay):
		fmt.Printf("    Task %s completed\n", t.id)
		return runner.TaskResult{Status: runner.StatusSuccess}
	case <-ctx.Done():
		fmt.Printf("    Task %s cancelled\n", t.id)
		return runner.TaskResult{Status: runner.StatusCancelled, Err: ctx.Err()}
	}
}
