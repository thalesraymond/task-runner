import { describe, it, expect } from "vitest";
import { ExecutionConstants } from "../src/ExecutionConstants.js";

describe("ExecutionConstants Mutants", () => {
  it("should have correct constant values", () => {
    expect(ExecutionConstants.SKIPPED_BY_CONDITION).toBe("Skipped by condition evaluation.");
    expect(ExecutionConstants.EXECUTION_STRATEGY_FAILED).toBe("Execution strategy failed.");
    expect(ExecutionConstants.WORKFLOW_CANCELLED).toBe("Workflow cancelled.");
  });
});
