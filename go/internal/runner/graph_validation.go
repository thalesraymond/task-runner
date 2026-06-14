package runner

// TaskDefinition defines the metadata for a task in the graph.
// It is separate from the runnable Task interface to allow validation
// before executing or instantiating state.
type TaskDefinition struct {
	ID           string
	Dependencies []string
}

// TaskGraph represents the directed graph of tasks.
type TaskGraph struct {
	Tasks []TaskDefinition
}

// Validate checks a TaskGraph for structural integrity:
// 1. Duplicate task IDs.
// 2. Missing dependencies.
// 3. Circular dependencies (cycles).
// It returns a ValidationErrors if any issues are found, or nil if valid.
func Validate(graph *TaskGraph) error {
	var errs ValidationErrors

	taskMap := make(map[string]TaskDefinition)

	// 1. Check for duplicate IDs and build taskMap
	for _, task := range graph.Tasks {
		if _, exists := taskMap[task.ID]; exists {
			errs = append(errs, &DuplicateTaskError{TaskID: task.ID})
		} else {
			taskMap[task.ID] = task
		}
	}

	// 2. Check for missing dependencies
	hasMissingDeps := false
	for _, task := range graph.Tasks {
		for _, depID := range task.Dependencies {
			if _, exists := taskMap[depID]; !exists {
				errs = append(errs, &MissingDependencyError{
					TaskID:              task.ID,
					MissingDependencyID: depID,
				})
				hasMissingDeps = true
			}
		}
	}

	// 3. Check for cycles (only if there are no missing dependencies, to avoid looking up missing nodes)
	if !hasMissingDeps {
		checkCycles(graph, taskMap, &errs)
	}

	if len(errs) > 0 {
		return errs
	}
	return nil
}

type stackFrame struct {
	taskID       string
	dependencies []string
	index        int
}

func checkCycles(graph *TaskGraph, taskMap map[string]TaskDefinition, errs *ValidationErrors) {
	visited := make(map[string]bool)
	recursionStack := make(map[string]int)

	for _, task := range graph.Tasks {
		if visited[task.ID] {
			continue
		}

		var path []string

		// Use an explicit stack for DFS to prevent deep recursion stack overflow
		var stack []stackFrame

		visited[task.ID] = true
		recursionStack[task.ID] = 0
		path = append(path, task.ID)

		stack = append(stack, stackFrame{
			taskID:       task.ID,
			dependencies: taskMap[task.ID].Dependencies,
			index:        0,
		})

		cycleFound := false

		for len(stack) > 0 && !cycleFound {
			frameIdx := len(stack) - 1
			frame := &stack[frameIdx]

			if frame.index < len(frame.dependencies) {
				depID := frame.dependencies[frame.index]
				frame.index++

				if pathIdx, ok := recursionStack[depID]; ok {
					// Cycle detected!
					cyclePath := make([]string, len(path)-pathIdx)
					copy(cyclePath, path[pathIdx:])
					cyclePath = append(cyclePath, depID)

					*errs = append(*errs, &CycleError{CyclePath: cyclePath})
					cycleFound = true
					break
				}

				if !visited[depID] {
					visited[depID] = true
					recursionStack[depID] = len(path)
					path = append(path, depID)

					stack = append(stack, stackFrame{
						taskID:       depID,
						dependencies: taskMap[depID].Dependencies,
						index:        0,
					})
				}
			} else {
				// Finished all dependencies for this node
				delete(recursionStack, frame.taskID)
				path = path[:len(path)-1]
				stack = stack[:len(stack)-1]
			}
		}

		// Break after first cycle to avoid spamming similar cycles
		if cycleFound {
			break
		}
	}
}
