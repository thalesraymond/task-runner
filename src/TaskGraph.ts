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
