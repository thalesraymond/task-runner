package runner

import (
	"context"
	"testing"
)

type mockPlugin struct {
	workflowStartCalls int
	workflowEndCalls   int
	taskStartCalls     int
	taskEndCalls       int
}

func (m *mockPlugin) OnWorkflowStart(ctx context.Context, event WorkflowStartEvent) {
	m.workflowStartCalls++
}

func (m *mockPlugin) OnWorkflowEnd(ctx context.Context, event WorkflowEndEvent) {
	m.workflowEndCalls++
}

func (m *mockPlugin) OnTaskStart(ctx context.Context, event TaskStartEvent) {
	m.taskStartCalls++
}

func (m *mockPlugin) OnTaskEnd(ctx context.Context, event TaskEndEvent) {
	m.taskEndCalls++
}

func TestEventDispatcher(t *testing.T) {
	dispatcher := NewEventDispatcher()
	plugin := &mockPlugin{}

	dispatcher.RegisterPlugin(plugin)

	ctx := context.Background()

	// Dispatch all event types
	dispatcher.Dispatch(ctx, WorkflowStartEvent{})
	dispatcher.Dispatch(ctx, WorkflowEndEvent{})
	dispatcher.Dispatch(ctx, TaskStartEvent{TaskID: "task1"})
	dispatcher.Dispatch(ctx, TaskEndEvent{TaskID: "task1", Result: TaskResult{Status: StatusSuccess}})

	// Shutdown ensures all events are drained
	dispatcher.Shutdown()

	if plugin.workflowStartCalls != 1 {
		t.Errorf("Expected 1 WorkflowStart call, got %d", plugin.workflowStartCalls)
	}
	if plugin.workflowEndCalls != 1 {
		t.Errorf("Expected 1 WorkflowEnd call, got %d", plugin.workflowEndCalls)
	}
	if plugin.taskStartCalls != 1 {
		t.Errorf("Expected 1 TaskStart call, got %d", plugin.taskStartCalls)
	}
	if plugin.taskEndCalls != 1 {
		t.Errorf("Expected 1 TaskEnd call, got %d", plugin.taskEndCalls)
	}

	// Test double shutdown (coverage)
	dispatcher.Shutdown()

	// Test dispatch after shutdown (coverage)
	dispatcher.Dispatch(ctx, WorkflowStartEvent{})
}

func TestEventDispatcher_ChannelFull(t *testing.T) {
	// Create dispatcher, buffer is 100
	dispatcher := NewEventDispatcher()

	// Register a slow plugin to ensure the channel fills if we spam?
	// Actually, just pushing events faster than they can be consumed.
	// But `Dispatch` blocks if full, so we can't just spam if it blocks without another goroutine.

	ctx := context.Background()
	for i := 0; i < 200; i++ {
		dispatcher.Dispatch(ctx, WorkflowStartEvent{})
	}

	dispatcher.Shutdown()
}

func TestRunnerShutdownWithDispatcher(t *testing.T) {
	r := New(5, &mockPlugin{})
	r.Shutdown() // Should safely shutdown the internal dispatcher
}

func TestRunnerShutdownWithoutDispatcher(t *testing.T) {
	r := &Runner{concurrency: 5} // nil dispatcher
	r.Shutdown()                 // Should not panic
}
func TestEventDispatcher_ContextCancellation(t *testing.T) {
	dispatcher := NewEventDispatcher()
	// Cancel the context directly
	dispatcher.cancel()
	// Wait to ensure the goroutine exits via ctx.Done()
	dispatcher.wg.Wait()
}
