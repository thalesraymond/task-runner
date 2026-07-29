package runner

import "context"

// taskRunnerConfig holds non-generic configuration for TaskRunner.
type taskRunnerConfig struct {
	concurrency int
	plugins     []any
}

// TaskRunnerOption is a functional option for configuring a TaskRunner.
type TaskRunnerOption func(*taskRunnerConfig)

// WithConcurrency sets the maximum number of tasks that can execute concurrently.
// A value of 0 means unlimited (default).
func WithConcurrency(n int) TaskRunnerOption {
	return func(cfg *taskRunnerConfig) {
		cfg.concurrency = n
	}
}

// WithPlugin registers a plugin that implements one or more listener interfaces.
func WithPlugin(p any) TaskRunnerOption {
	return func(cfg *taskRunnerConfig) {
		cfg.plugins = append(cfg.plugins, p)
	}
}

// TaskRunner is the central orchestrator for executing task graphs.
// It uses an ExecutionStrategy to wrap task execution and supports
// configuration via functional options.
type TaskRunner[T any] struct {
	config   taskRunnerConfig
	strategy ExecutionStrategy[T]
}

// NewTaskRunner creates a new TaskRunner with the given options.
// Defaults:
//   - concurrency: 0 (unlimited)
//   - strategy: StandardStrategy
func NewTaskRunner[T any](opts ...TaskRunnerOption) *TaskRunner[T] {
	var cfg taskRunnerConfig
	for _, opt := range opts {
		opt(&cfg)
	}
	return &TaskRunner[T]{
		config:   cfg,
		strategy: &StandardStrategy[T]{},
	}
}

// SetStrategy sets the execution strategy for the TaskRunner.
// Returns the runner for method chaining.
func (tr *TaskRunner[T]) SetStrategy(strategy ExecutionStrategy[T]) *TaskRunner[T] {
	tr.strategy = strategy
	return tr
}

// wrappedTask wraps a Task with an ExecutionStrategy so the strategy
// intercepts the Run call.
type wrappedTask[T any] struct {
	inner    Task[T]
	strategy ExecutionStrategy[T]
}

func (t *wrappedTask[T]) Run(ctx context.Context, sharedState T) TaskResult {
	return t.strategy.Execute(ctx, t.inner, sharedState)
}

// Execute runs a task graph with the configured strategy.
// It validates the graph, wraps all tasks with the execution strategy,
// and delegates to WorkflowExecutor for concurrent DAG execution.
func (tr *TaskRunner[T]) Execute(ctx context.Context, graph *TaskGraph, tasks map[string]Task[T], sharedState T) error {
	if err := Validate(graph); err != nil {
		return err
	}

	stateManager := NewTaskStateManager(graph)

	dispatcher := NewEventDispatcher()
	defer dispatcher.Shutdown()
	for _, p := range tr.config.plugins {
		dispatcher.RegisterPlugin(p)
	}

	// Wrap all tasks with the execution strategy
	wrappedTasks := make(map[string]Task[T], len(tasks))
	for id, task := range tasks {
		wrappedTasks[id] = &wrappedTask[T]{
			inner:    task,
			strategy: tr.strategy,
		}
	}

	executor := NewWorkflowExecutor[T](
		stateManager,
		wrappedTasks,
		sharedState,
		tr.config.concurrency,
		dispatcher,
	)

	return executor.Execute(ctx)
}
