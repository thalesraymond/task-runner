// specs/004-pre-execution-validation/contracts/api.ts

/**
 * Represents a single task in the task graph.
 */
export interface Task {
  /** Unique identifier for the task. */
  id: string;
  /** An array of task IDs that this task directly depends on. */
  dependencies: string[];
  /** Allows for any other properties specific to the task's payload or configuration. */
  [key: string]: unknown;
}

/**
 * Represents the entire collection of tasks and their interdependencies.
 */
export interface TaskGraph {
  /** An array of tasks that make up the graph. */
  tasks: Task[];
}

/**
 * Describes a specific validation error found in the task graph.
 */
export interface ValidationError {
  /** The type of validation error. */
  type: "cycle" | "missing_dependency" | "duplicate_task";
  /** A human-readable message describing the error. */
  message: string;
  /** Optional detailed information about the error, e.g., the cycle path, or the task with a missing dependency. */
  details?: unknown;
}

/**
 * The result of a task graph validation operation.
 */
export interface ValidationResult {
  /** True if the graph is valid, false otherwise. */
  isValid: boolean;
  /** An array of ValidationError objects if the graph is not valid. Empty if isValid is true. */
  errors: ValidationError[];
}

/**
 * Defines the interface for a task graph validator.
 */
export interface ITaskGraphValidator {
  /**
   * Validates a given task graph for structural integrity.
   * @param taskGraph The task graph to validate.
   * @returns A ValidationResult object indicating the outcome of the validation.
   */
  validate(taskGraph: TaskGraph): ValidationResult;
}
