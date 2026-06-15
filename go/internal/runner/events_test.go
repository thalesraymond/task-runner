package runner

import (
	"testing"
)

func TestEvents(t *testing.T) {
	WorkflowStartEvent{}.isEvent()
	WorkflowEndEvent{}.isEvent()
	TaskStartEvent{}.isEvent()
	TaskEndEvent{}.isEvent()
}
