package runner

import (
	"context"
	"fmt"
)

// taskCompletion carries the outcome of a single task execution back to the
// main execution loop of WorkflowExecutor.
type taskCompletion struct {
	taskID string
	result TaskResult
}

// WorkflowExecutor manages the concurrent execution of a task graph using
// goroutines and channels. It enforces a concurrency limit via a semaphore
// pattern (buffered channel) and collects task outcomes through a buffered
// results channel.
//
// The executor follows a single-producer-per-task, single-consumer (main loop)
// model. Ready tasks are dispatched into their own goroutine, each of which:
//  1. Acquires a semaphore slot (blocks until under the limit, or exits if
//     the context is cancelled while waiting)
//  2. Marks the task as running in the TaskStateManager
//  3. Executes the task's Run method
//  4. Sends the result back on the results channel
//  5. Releases the semaphore slot
//
// T is the type of the shared state object passed to every task's Run method.
type WorkflowExecutor[T any] struct {
	stateManager  *TaskStateManager
	tasks         map[string]Task[T]
	sharedState   T
	maxConcurrent int
	dispatcher    *EventDispatcher
}

// NewWorkflowExecutor creates a new WorkflowExecutor with the given
// dependencies, task map, shared state, concurrency limit, and event
// dispatcher.
//
// If maxConcurrent is zero or negative, it defaults to the total number of
// tasks (effectively unlimited concurrency for small graphs).
func NewWorkflowExecutor[T any](
	stateManager *TaskStateManager,
	tasks map[string]Task[T],
	sharedState T,
	maxConcurrent int,
	dispatcher *EventDispatcher,
) *WorkflowExecutor[T] {
	if maxConcurrent <= 0 {
		maxConcurrent = len(tasks)
	}
	return &WorkflowExecutor[T]{
		stateManager:  stateManager,
		tasks:         tasks,
		sharedState:   sharedState,
		maxConcurrent: maxConcurrent,
		dispatcher:    dispatcher,
	}
}

// Execute runs the full task graph to completion or until the context is
// cancelled. It returns nil on success, ctx.Err() on cancellation, or an
// error summarising any task failures.
//
// The execution loop:
//  1. Dispatches every ready task whose dependencies are met and that hasn't
//     been dispatched yet.
//  2. Waits for the next task completion (or context cancellation).
//  3. Updates the TaskStateManager with the result, cascading skips to
//     dependents if a task fails.
//  4. Repeats until all tasks reach a completed state.
func (e *WorkflowExecutor[T]) Execute(ctx context.Context) error {
	if len(e.tasks) == 0 {
		return nil
	}

	e.dispatcher.Dispatch(ctx, WorkflowStartEvent{})

	semaphore := make(chan struct{}, e.maxConcurrent)
	results := make(chan taskCompletion, len(e.tasks))
	dispatched := make(map[string]bool)

	// allComplete returns true when every task has reached TaskStateCompleted
	// in the TaskStateManager.
	allComplete := func() bool {
		for taskID := range e.tasks {
			state, exists := e.stateManager.GetState(taskID)
			if !exists || state != TaskStateCompleted {
				return false
			}
		}
		return true
	}

	for !allComplete() {
		// Dispatch every ready task that hasn't been dispatched yet.
		for taskID := range e.tasks {
			if dispatched[taskID] {
				continue
			}
			state, exists := e.stateManager.GetState(taskID)
			if !exists || state != TaskStatePending {
				continue
			}
			if !e.stateManager.AreDependenciesMet(taskID) {
				continue
			}
			dispatched[taskID] = true
			go e.runTask(ctx, taskID, semaphore, results)
		}

		select {
		case <-ctx.Done():
			// If all tasks happened to complete right before cancellation
			// arrived, finish cleanly.
			if allComplete() {
				continue
			}
			e.dispatcher.Dispatch(ctx, WorkflowEndEvent{})
			return ctx.Err()
		case completion := <-results:
			e.handleResult(completion)
		}
	}

	// Aggregate any failures for the return value.
	var failedTasks []string
	for taskID := range e.tasks {
		result, ok := e.stateManager.GetResult(taskID)
		if ok && result.Status == StatusFailure {
			failedTasks = append(failedTasks, taskID)
		}
	}

	e.dispatcher.Dispatch(ctx, WorkflowEndEvent{})

	if len(failedTasks) > 0 {
		return fmt.Errorf("workflow completed with %d failed task(s): %v",
			len(failedTasks), failedTasks)
	}

	return nil
}

// handleResult processes a task completion, updating the TaskStateManager.
// It cascades skips to dependents when a task fails.
func (e *WorkflowExecutor[T]) handleResult(comp taskCompletion) {
	state, _ := e.stateManager.GetState(comp.taskID)
	if state == TaskStateCompleted {
		// Already handled via cascade from another failure or race.
		return
	}

	if comp.result.Status == StatusFailure && comp.result.Err != nil {
		e.stateManager.MarkDependencyFailed(comp.taskID, comp.result.Err)
	} else {
		e.stateManager.MarkCompleted(comp.taskID, comp.result)
	}
}

// runTask executes a single task in its own goroutine.
//
// It first attempts to acquire a semaphore slot. If the context is cancelled
// while waiting, it reports the task as cancelled and exits immediately
// without holding a slot.
func (e *WorkflowExecutor[T]) runTask(
	ctx context.Context,
	taskID string,
	semaphore chan struct{},
	results chan<- taskCompletion,
) {
	// Acquire semaphore slot or bail on cancellation.
	select {
	case semaphore <- struct{}{}:
		defer func() { <-semaphore }()
	case <-ctx.Done():
		results <- taskCompletion{
			taskID: taskID,
			result: TaskResult{Status: StatusCancelled, Err: ctx.Err()},
		}
		return
	}

	// Attempt to mark the task as running. This can fail if the task was
	// already skipped via a dependency-failure cascade while this goroutine
	// was waiting on the semaphore.
	if err := e.stateManager.MarkRunning(taskID); err != nil {
		result, ok := e.stateManager.GetResult(taskID)
		if !ok {
			result = TaskResult{Status: StatusCancelled}
		}
		results <- taskCompletion{taskID: taskID, result: result}
		return
	}

	task := e.tasks[taskID]

	e.dispatcher.Dispatch(ctx, TaskStartEvent{TaskID: taskID})
	result := task.Run(ctx, e.sharedState)
	e.dispatcher.Dispatch(ctx, TaskEndEvent{TaskID: taskID, Result: result})

	results <- taskCompletion{taskID: taskID, result: result}
}
