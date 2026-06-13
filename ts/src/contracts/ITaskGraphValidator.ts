import { TaskGraph } from "../TaskGraph.js";
import { ValidationResult } from "./ValidationResult.js";

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

  /**
   * Creates a human-readable error message from a validation result.
   * @param result The validation result containing errors.
   * @returns A formatted error string.
   */
  createErrorMessage(result: ValidationResult): string;
}
