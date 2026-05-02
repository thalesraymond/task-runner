import { describe, it, expect } from "vitest";
import { TaskGraphValidationError } from "../src/TaskGraphValidationError.js";
import { ValidationResult } from "../src/contracts/ValidationResult.js";

describe("TaskGraphValidationError Mutants", () => {
  it("should have correct name property", () => {
    const result: ValidationResult = { isValid: false, errors: [] };
    const error = new TaskGraphValidationError(result, "validation failed");
    expect(error.name).toBe("TaskGraphValidationError");
  });
});
