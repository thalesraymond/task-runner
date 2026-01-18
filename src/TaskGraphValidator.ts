import { ITaskGraphValidator, TaskGraph, ValidationResult, ValidationError } from "./validation-contracts.js";

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
            for (const depId of task.dependencies) {
                if (!taskIds.has(depId)) {
                    errors.push({
                        type: "missing_dependency",
                        message: `Task '${task.id}' depends on missing task '${depId}'`,
                        details: { taskId: task.id, missingDependencyId: depId }
                    });
                }
            }
        }

        // 3. Check for cycles
        // Only run cycle detection if there are no missing dependencies, otherwise we might chase non-existent nodes.
        const hasMissingDeps = errors.some(e => e.type === "missing_dependency");

        if (!hasMissingDeps) {
             // Build adjacency list
            const adj = new Map<string, string[]>();
            for (const task of taskGraph.tasks) {
                adj.set(task.id, task.dependencies);
            }

            const visited = new Set<string>();
            const recursionStack = new Set<string>();

            for (const task of taskGraph.tasks) {
                if (!visited.has(task.id)) {
                    const path: string[] = [];
                    if (this.detectCycle(task.id, path, visited, recursionStack, adj)) {
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
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    private detectCycle(
        taskId: string,
        path: string[],
        visited: Set<string>,
        recursionStack: Set<string>,
        adj: Map<string, string[]>
    ): boolean {
        visited.add(taskId);
        recursionStack.add(taskId);
        path.push(taskId);

        const dependencies = adj.get(taskId)!;
        for (const depId of dependencies) {
            if (
                !visited.has(depId) &&
                this.detectCycle(depId, path, visited, recursionStack, adj)
            ) {
                return true;
            } else if (recursionStack.has(depId)) {
                // Cycle detected
                // Add the dependency to complete the visual cycle
                path.push(depId);
                return true;
            }
        }

        recursionStack.delete(taskId);
        path.pop();
        return false;
    }
}
export { TaskGraph };
