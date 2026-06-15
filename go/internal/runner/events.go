package runner

import "context"

// WorkflowStartEvent is emitted when a workflow begins execution.
type WorkflowStartEvent struct{}

// WorkflowEndEvent is emitted when a workflow completes execution.
type WorkflowEndEvent struct{}

// TaskStartEvent is emitted just before a task begins execution.
type TaskStartEvent struct {
	TaskID string
}

// TaskEndEvent is emitted just after a task completes execution.
type TaskEndEvent struct {
	TaskID string
	Result TaskResult
}

// Event is a marker interface for all events to ensure type safety.
type Event interface {
	isEvent()
}

func (WorkflowStartEvent) isEvent() { _ = 1 }
func (WorkflowEndEvent) isEvent()   { _ = 1 }
func (TaskStartEvent) isEvent()     { _ = 1 }
func (TaskEndEvent) isEvent()       { _ = 1 }

// WorkflowStartListener is implemented by plugins that want to hook into workflow start.
type WorkflowStartListener interface {
	OnWorkflowStart(ctx context.Context, event WorkflowStartEvent)
}

// WorkflowEndListener is implemented by plugins that want to hook into workflow end.
type WorkflowEndListener interface {
	OnWorkflowEnd(ctx context.Context, event WorkflowEndEvent)
}

// TaskStartListener is implemented by plugins that want to hook into task start.
type TaskStartListener interface {
	OnTaskStart(ctx context.Context, event TaskStartEvent)
}

// TaskEndListener is implemented by plugins that want to hook into task end.
type TaskEndListener interface {
	OnTaskEnd(ctx context.Context, event TaskEndEvent)
}
