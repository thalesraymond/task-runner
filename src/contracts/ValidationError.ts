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
