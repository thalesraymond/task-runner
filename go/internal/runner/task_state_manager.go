package runner

import (
	"fmt"
	"sync"
)

// TaskState represents the lifecycle state of a task within the TaskStateManager.
type TaskState int

const (
	// TaskStatePending indicates the task is queued but not yet started.
	TaskStatePending TaskState = iota
	// TaskStateRunning indicates the task is currently executing.
	TaskStateRunning
	// TaskStateCompleted indicates the task has finished execution and has a result.
	TaskStateCompleted
)

// String returns the human-readable name of the TaskState.
func (s TaskState) String() string {
	switch s {
	case TaskStatePending:
		return "pending"
	case TaskStateRunning:
		return "running"
	case TaskStateCompleted:
		return "completed"
	default:
		return "unknown"
	}
}

// TaskStateManager manages the lifecycle state and results of tasks in a task graph.
// All exported methods are safe for concurrent use.
type TaskStateManager struct {
	mu           sync.RWMutex
	states       map[string]TaskState
	results      map[string]TaskResult
	dependencies map[string][]string
	dependents   map[string][]string
}

// NewTaskStateManager creates a new TaskStateManager initialised from a TaskGraph.
// All tasks are set to TaskStatePending and dependency/dependent maps are populated.
// A nil graph produces an empty manager.
func NewTaskStateManager(graph *TaskGraph) *TaskStateManager {
	tsm := &TaskStateManager{
		states:       make(map[string]TaskState),
		results:      make(map[string]TaskResult),
		dependencies: make(map[string][]string),
		dependents:   make(map[string][]string),
	}

	if graph != nil {
		for _, task := range graph.Tasks {
			tsm.states[task.ID] = TaskStatePending

			deps := make([]string, len(task.Dependencies))
			copy(deps, task.Dependencies)
			tsm.dependencies[task.ID] = deps

			for _, depID := range deps {
				tsm.dependents[depID] = append(tsm.dependents[depID], task.ID)
			}
		}
	}

	return tsm
}

// GetState returns the current lifecycle state of the task and whether the task exists.
func (tsm *TaskStateManager) GetState(taskID string) (TaskState, bool) {
	tsm.mu.RLock()
	defer tsm.mu.RUnlock()
	state, ok := tsm.states[taskID]
	return state, ok
}

// GetResult returns the result for a completed task and whether a result exists.
func (tsm *TaskStateManager) GetResult(taskID string) (TaskResult, bool) {
	tsm.mu.RLock()
	defer tsm.mu.RUnlock()
	result, ok := tsm.results[taskID]
	return result, ok
}

// GetDependencies returns a copy of the dependency ID list for a task.
// Returns nil if the task does not exist.
func (tsm *TaskStateManager) GetDependencies(taskID string) []string {
	tsm.mu.RLock()
	defer tsm.mu.RUnlock()
	deps, ok := tsm.dependencies[taskID]
	if !ok {
		return nil
	}
	out := make([]string, len(deps))
	copy(out, deps)
	return out
}

// GetDependents returns a copy of the dependent ID list for a task (tasks that depend on it).
// Returns nil if the task does not exist.
func (tsm *TaskStateManager) GetDependents(taskID string) []string {
	tsm.mu.RLock()
	defer tsm.mu.RUnlock()
	deps, ok := tsm.dependents[taskID]
	if !ok {
		return nil
	}
	out := make([]string, len(deps))
	copy(out, deps)
	return out
}

// AreDependenciesMet checks whether all dependencies of a task have completed successfully.
// It returns true when the task has no dependencies or every dependency has
// StatusSuccess. It returns false if the task does not exist, any dependency is
// not yet completed, or any dependency completed with a non-success status.
func (tsm *TaskStateManager) AreDependenciesMet(taskID string) bool {
	tsm.mu.RLock()
	defer tsm.mu.RUnlock()
	deps, ok := tsm.dependencies[taskID]
	if !ok {
		return false
	}
	for _, depID := range deps {
		state, exists := tsm.states[depID]
		if !exists || state != TaskStateCompleted {
			return false
		}
		result, hasResult := tsm.results[depID]
		if !hasResult || result.Status != StatusSuccess {
			return false
		}
	}
	return true
}

// MarkRunning transitions a task from Pending to Running.
// Returns an error if the task is not found or is not in the Pending state.
func (tsm *TaskStateManager) MarkRunning(taskID string) error {
	tsm.mu.Lock()
	defer tsm.mu.Unlock()
	state, ok := tsm.states[taskID]
	if !ok {
		return fmt.Errorf("task %q not found", taskID)
	}
	if state != TaskStatePending {
		return fmt.Errorf("task %q is in state %s, expected %s", taskID, state, TaskStatePending)
	}
	tsm.states[taskID] = TaskStateRunning
	return nil
}

// MarkCompleted transitions a task to Completed and stores the given result.
// Both Running and Pending are accepted as pre-transition states, allowing
// tasks to be skipped before they start. Returns an error if the task is not
// found or is already completed.
func (tsm *TaskStateManager) MarkCompleted(taskID string, result TaskResult) error {
	tsm.mu.Lock()
	defer tsm.mu.Unlock()
	state, ok := tsm.states[taskID]
	if !ok {
		return fmt.Errorf("task %q not found", taskID)
	}
	if state == TaskStateCompleted {
		return fmt.Errorf("task %q is already completed", taskID)
	}
	tsm.states[taskID] = TaskStateCompleted
	tsm.results[taskID] = result
	return nil
}

// MarkFailed is a convenience method that marks a task as completed with StatusFailure.
func (tsm *TaskStateManager) MarkFailed(taskID string, err error) error {
	return tsm.MarkCompleted(taskID, TaskResult{Status: StatusFailure, Err: err})
}

// MarkSkipped is a convenience method that marks a task as completed with StatusSkipped.
func (tsm *TaskStateManager) MarkSkipped(taskID string) error {
	return tsm.MarkCompleted(taskID, TaskResult{Status: StatusSkipped})
}

// MarkDependencyFailed marks a task as failed and cascades the skip to all
// pending dependents. Dependents are recursively marked as skipped so the
// entire affected sub-graph transitions to the skipped state.
//
// It returns the list of all task IDs that were skipped as a result of the
// cascade. An error is returned if the task is not found or is already completed.
func (tsm *TaskStateManager) MarkDependencyFailed(taskID string, err error) ([]string, error) {
	tsm.mu.Lock()
	defer tsm.mu.Unlock()
	state, ok := tsm.states[taskID]
	if !ok {
		return nil, fmt.Errorf("task %q not found", taskID)
	}
	if state == TaskStateCompleted {
		return nil, fmt.Errorf("task %q is already completed", taskID)
	}

	tsm.states[taskID] = TaskStateCompleted
	tsm.results[taskID] = TaskResult{Status: StatusFailure, Err: err}

	skipped := tsm.cascadeSkip(taskID)
	return skipped, nil
}

// cascadeSkip recursively marks all pending dependents of the given task as
// skipped (Completed + StatusSkipped). It continues through each skipped
// task's own dependents, effectively propagating the skip through the
// sub-graph.
//
// Must be called while holding tsm.mu.Lock.
func (tsm *TaskStateManager) cascadeSkip(taskID string) []string {
	var skipped []string
	queue := []string{taskID}
	seen := make(map[string]bool)

	for len(queue) > 0 {
		current := queue[0]
		queue = queue[1:]
		if seen[current] {
			continue
		}
		seen[current] = true

		for _, depID := range tsm.dependents[current] {
			if _, exists := tsm.states[depID]; !exists {
				continue
			}
			if tsm.states[depID] == TaskStatePending {
				tsm.states[depID] = TaskStateCompleted
				tsm.results[depID] = TaskResult{Status: StatusSkipped}
				skipped = append(skipped, depID)
				queue = append(queue, depID)
			}
		}
	}

	return skipped
}
