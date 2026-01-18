import { ITaskGraphValidator } from "./contracts/ITaskGraphValidator.js";
import { ValidationResult } from "./contracts/ValidationResult.js";
import { ValidationError } from "./contracts/ValidationError.js";
import { TaskGraph } from "./TaskGraph.js";

export class TaskGraphValidator implements ITaskGraphValidator {
    /**
     * Validates a given task graph for structural integrity.
     * Checks for:
     * 1. Duplicate task IDs.
     * 2. Missing dependencies (tasks that depend on non-existent IDs).
     * 3. Circular dependencies (cycles in the graph).
     *
     * @param taskGraph The task graph to validate.
     * @returns A ValidationResult object indicating the outcome of the validation.
     */
    validate(taskGraph: TaskGraph): ValidationResult {
        const errors: ValidationError[] = [];

        // 1. Check for duplicate tasks
        const taskIds = new Set<string>();
        for (const task of taskGraph.tasks) {
            if (taskIds.has(task.id)) {
                errors.push({
                    type: "duplicate_task",
                    message: `Duplicate task detected with ID: ${task.id}`,
                    details: { taskId: task.id }
                });
            } else {
                taskIds.add(task.id);
            }
        }

        // 2. Check for missing dependencies
        for (const task of taskGraph.tasks) {
            for (const dependenceId of task.dependencies) {
                if (!taskIds.has(dependenceId)) {
                    errors.push({
                        type: "missing_dependency",
                        message: `Task '${task.id}' depends on missing task '${dependenceId}'`,
                        details: { taskId: task.id, missingDependencyId: dependenceId }
                    });
                }
            }
        }

        // 3. Check for cycles
        // Only run cycle detection if there are no missing dependencies, otherwise we might chase non-existent nodes.
        const hasMissingDependencies = errors.some(e => e.type === "missing_dependency");

        if (hasMissingDependencies) {
            return {
                isValid: errors.length === 0,
                errors
            };
        }

        // Build adjacency list
        const adjacencyList = new Map<string, string[]>();
        for (const task of taskGraph.tasks) {
            adjacencyList.set(task.id, task.dependencies);
        }

        const visited = new Set<string>();
        const recursionStack = new Set<string>();

        for (const task of taskGraph.tasks) {
            if (visited.has(task.id)) {
                continue;
            }

            const path = this.detectCycle(task.id, visited, recursionStack, adjacencyList);
            if (path) {
                // Extract the actual cycle from the path
                // The path might look like A -> B -> C -> B (if we started at A and found cycle B-C-B)
                const cycleStart = path[path.length - 1];
                const cycleStartIndex = path.indexOf(cycleStart);
                const cyclePath = path.slice(cycleStartIndex);

                errors.push({
                    type: "cycle",
                    message: `Cycle detected: ${cyclePath.join(" -> ")}`,
                    details: { cyclePath }
                });
                // Break after first cycle found to avoid spamming similar errors
                break;
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    private detectCycle(
        startNode: string,
        visited: Set<string>,
        recursionStack: Set<string>,
        adjacencyList: Map<string, string[]>
    ): string[] | null {
        // Use parallel stacks to simulate recursion and avoid object allocation per frame
        const nodeStack: string[] = [startNode];
        const indexStack: number[] = [0];
        const path: string[] = [];

        while (nodeStack.length > 0) {
            const taskId = nodeStack[nodeStack.length - 1];
            const nextDepIndex = indexStack[indexStack.length - 1];

            // Pre-process (simulate function entry)
            // Only perform this when entering the node for the first time
            if (nextDepIndex === 0) {
                visited.add(taskId);
                recursionStack.add(taskId);
                path.push(taskId);
            }

            const dependencies = adjacencyList.get(taskId) ?? [];

            if (nextDepIndex < dependencies.length) {
                const depId = dependencies[nextDepIndex];
                // Increment index so that when we return to this frame, we process the next dependency
                indexStack[indexStack.length - 1]++;

                if (!visited.has(depId)) {
                    // Push new frame (simulate recursive call)
                    nodeStack.push(depId);
                    indexStack.push(0);
                    continue;
                } else if (recursionStack.has(depId)) {
                    // Cycle detected
                    path.push(depId);
                    return path;
                }
                // If visited but not in recursionStack, it's a cross edge to an already processed node.
                // We just ignore it and loop again to process next dependency of current frame.
            } else {
                // Post-process (simulate function return)
                // All dependencies processed
                recursionStack.delete(taskId);
                path.pop();
                nodeStack.pop();
                indexStack.pop();
            }
        }

        return null;
    }
}
