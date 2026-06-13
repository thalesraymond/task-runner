import { ValidationError } from "./ValidationError.js";

/**
 * The result of a task graph validation operation.
 */
export interface ValidationResult {
  /** True if the graph is valid, false otherwise. */
  isValid: boolean;
  /** An array of ValidationError objects if the graph is not valid. Empty if isValid is true. */
  errors: ValidationError[];
}
