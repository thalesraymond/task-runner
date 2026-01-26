import { ITaskGraphValidator } from "./contracts/ITaskGraphValidator.js";
import { ValidationResult } from "./contracts/ValidationResult.js";
import { ValidationError } from "./contracts/ValidationError.js";
import { TaskGraph, Task } from "./TaskGraph.js";
import {
  ERROR_CYCLE,
  ERROR_DUPLICATE_TASK,
  ERROR_MISSING_DEPENDENCY,
} from "./contracts/ErrorTypes.js";

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

    // 1. Build Map and Check Duplicates (Single Pass)
    const taskMap = this.buildTaskMapAndCheckDuplicates(taskGraph, errors);

    // 2. Check for missing dependencies
    this.checkMissingDependencies(taskGraph, taskMap, errors);

    // 3. Check for cycles
    // Only run cycle detection if there are no missing dependencies, otherwise we might chase non-existent nodes.
    const hasMissingDependencies = errors.some(
      (e) => e.type === ERROR_MISSING_DEPENDENCY
    );

    if (!hasMissingDependencies) {
      this.checkCycles(taskGraph, taskMap, errors);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Creates a human-readable error message from a validation result.
   * @param result The validation result containing errors.
   * @returns A formatted error string.
   */
  createErrorMessage(result: ValidationResult): string {
    const errorDetails = result.errors.map((e) => e.message);
    return `Task graph validation failed: ${errorDetails.join("; ")}`;
  }

  private buildTaskMapAndCheckDuplicates(
    taskGraph: TaskGraph,
    errors: ValidationError[]
  ): Map<string, Task> {
    const taskMap = new Map<string, Task>();
    for (const task of taskGraph.tasks) {
      if (taskMap.has(task.id)) {
        errors.push({
          type: ERROR_DUPLICATE_TASK,
          message: `Duplicate task detected with ID: ${task.id}`,
          details: { taskId: task.id },
        });
      } else {
        taskMap.set(task.id, task);
      }
    }
    return taskMap;
  }

  private checkMissingDependencies(
    taskGraph: TaskGraph,
    taskMap: Map<string, Task>,
    errors: ValidationError[]
  ): void {
    for (const task of taskGraph.tasks) {
      for (const dependenceId of task.dependencies) {
        if (!taskMap.has(dependenceId)) {
          errors.push({
            type: ERROR_MISSING_DEPENDENCY,
            message: `Task '${task.id}' depends on missing task '${dependenceId}'`,
            details: { taskId: task.id, missingDependencyId: dependenceId },
          });
        }
      }
    }
  }

  private checkCycles(
    taskGraph: TaskGraph,
    taskMap: Map<string, Task>,
    errors: ValidationError[]
  ): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    for (const task of taskGraph.tasks) {
      if (visited.has(task.id)) {
        continue;
      }

      const path: string[] = [];
      if (
        this.detectCycle(task.id, path, visited, recursionStack, taskMap)
      ) {
        // Extract the actual cycle from the path
        // The path might look like A -> B -> C -> B (if we started at A and found cycle B-C-B)
        const cycleStart = path[path.length - 1];
        const cycleStartIndex = path.indexOf(cycleStart);
        const cyclePath = path.slice(cycleStartIndex);

        errors.push({
          type: ERROR_CYCLE,
          message: `Cycle detected: ${cyclePath.join(" -> ")}`,
          details: { cyclePath },
        });
        // Break after first cycle found to avoid spamming similar errors
        break;
      }
    }
  }

  private detectCycle(
    startTaskId: string,
    path: string[],
    visited: Set<string>,
    recursionStack: Set<string>,
    taskMap: Map<string, Task>
  ): boolean {
    // Use an explicit stack to avoid maximum call stack size exceeded errors
    const stack: { taskId: string; index: number; dependencies: string[] }[] =
      [];

    visited.add(startTaskId);
    recursionStack.add(startTaskId);
    path.push(startTaskId);

    stack.push({
      taskId: startTaskId,
      index: 0,
      dependencies: taskMap.get(startTaskId)!.dependencies,
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
            dependencies: taskMap.get(dependenceId)!.dependencies,
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
