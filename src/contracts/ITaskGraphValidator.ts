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
}
