import {
  ERROR_CYCLE,
  ERROR_DUPLICATE_TASK,
  ERROR_MISSING_DEPENDENCY,
} from "./ErrorTypes.js";

/**
 * Describes a specific validation error found in the task graph.
 */
export interface ValidationError {
  /** The type of validation error. */
  type:
    | typeof ERROR_CYCLE
    | typeof ERROR_MISSING_DEPENDENCY
    | typeof ERROR_DUPLICATE_TASK;
  /** A human-readable message describing the error. */
  message: string;
  /** Optional detailed information about the error, e.g., the cycle path, or the task with a missing dependency. */
  details?: unknown;
}
