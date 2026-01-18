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

            const path: string[] = [];
            if (this.detectCycle(task.id, path, visited, recursionStack, adjacencyList)) {
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

    /**
     * Creates a human-readable error message from a validation result.
     * @param result The validation result containing errors.
     * @returns A formatted error string.
     */
    createErrorMessage(result: ValidationResult): string {
        const errorDetails = result.errors.map(e => e.message);
        return `Task graph validation failed: ${errorDetails.join("; ")}`;
    }

    private detectCycle(
        startTaskId: string,
        path: string[],
        visited: Set<string>,
        recursionStack: Set<string>,
        adjacencyList: Map<string, string[]>
    ): boolean {
        // Use an explicit stack to avoid maximum call stack size exceeded errors
        const stack: { taskId: string; index: number; dependencies: string[] }[] = [];

        visited.add(startTaskId);
        recursionStack.add(startTaskId);
        path.push(startTaskId);

        stack.push({
            taskId: startTaskId,
            index: 0,
            dependencies: adjacencyList.get(startTaskId)!
        });

        while (stack.length > 0) {
            const frame = stack[stack.length - 1];
            const { taskId, dependencies } = frame;

            if (frame.index < dependencies.length) {
                const dependenceId = dependencies[frame.index];
                frame.index++;

                if (recursionStack.has(dependenceId)) {
                    // Cycle detected
                    path.push(dependenceId);
                    return true;
                }

                if (!visited.has(dependenceId)) {
                    visited.add(dependenceId);
                    recursionStack.add(dependenceId);
                    path.push(dependenceId);

                    stack.push({
                        taskId: dependenceId,
                        index: 0,
                        dependencies: adjacencyList.get(dependenceId)!
                    });
                }
            } else {
                // Finished all dependencies for this node
                recursionStack.delete(taskId);
                path.pop();
                stack.pop();
            }
        }

        return false;
    }
}
