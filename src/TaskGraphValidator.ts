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

    private detectCycle(
        taskId: string,
        path: string[],
        visited: Set<string>,
        recursionStack: Set<string>,
        adjacencyList: Map<string, string[]>
    ): boolean {
        visited.add(taskId);
        recursionStack.add(taskId);
        path.push(taskId);

        const dependencies = adjacencyList.get(taskId)!;
        for (const dependenceId of dependencies) {
            if (
                !visited.has(dependenceId) &&
                this.detectCycle(dependenceId, path, visited, recursionStack, adjacencyList)
            ) {
                return true;
            } else if (recursionStack.has(dependenceId)) {
                // Cycle detected
                // Add the dependency to complete the visual cycle
                path.push(dependenceId);
                return true;
            }
        }

        recursionStack.delete(taskId);
        path.pop();
        return false;
    }
}
export { TaskGraph };
