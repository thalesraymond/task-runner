import { ValidationResult } from "./contracts/ValidationResult.js";

/**
 * Error thrown when a task graph fails validation.
 * Contains the validation result with detailed error information.
 */
export class TaskGraphValidationError extends Error {
  constructor(
    public result: ValidationResult,
    message: string
  ) {
    super(message);
    this.name = "TaskGraphValidationError";
  }
}
