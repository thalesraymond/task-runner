import { describe, it, expect } from "vitest";
import { TaskRunnerBuilder } from "../../src/TaskRunnerBuilder.js";
import { TaskStep } from "../../src/TaskStep.js";
import { RetryingExecutionStrategy } from "../../src/strategies/RetryingExecutionStrategy.js";
import { StandardExecutionStrategy } from "../../src/strategies/StandardExecutionStrategy.js";

describe("Integration: Conditional Retries", () => {
  it("should retry on allowed errors and fail fast on blocked errors", async () => {
    type TestContext = {
      transientAttempt: number;
      permanentAttempt: number;
    };

    const transientTask: TaskStep<TestContext> = {
      name: "TransientTask",
      retry: {
        attempts: 3,
        delay: 10, // Short delay for test
        shouldRetry: (error: unknown) => error === "TransientError",
      },
      run: async (ctx) => {
        ctx.transientAttempt++;
        if (ctx.transientAttempt < 3) {
          return { status: "failure", error: "TransientError" };
        }
        return { status: "success" };
      },
    };

    const permanentTask: TaskStep<TestContext> = {
      name: "PermanentTask",
      retry: {
        attempts: 3,
        delay: 10,
        shouldRetry: (error: unknown) => error !== "PermanentError",
      },
      run: async (ctx) => {
        ctx.permanentAttempt++;
        return { status: "failure", error: "PermanentError" };
      },
    };

    const context: TestContext = { transientAttempt: 0, permanentAttempt: 0 };

    // Use the real strategy chain with retries enabled
    const runner = new TaskRunnerBuilder(context)
      .useStrategy(new RetryingExecutionStrategy(new StandardExecutionStrategy()))
      .build();

    const results = await runner.execute([transientTask, permanentTask]);

    // Transient task should have consumed retries and eventually succeeded
    expect(context.transientAttempt).toBe(3);
    const transientResult = results.get("TransientTask");
    expect(transientResult?.status).toBe("success");

    // Permanent task should have failed fast on the first attempt
    expect(context.permanentAttempt).toBe(1);
    const permanentResult = results.get("PermanentTask");
    expect(permanentResult?.status).toBe("failure");
    expect(permanentResult?.error).toBe("PermanentError");
  });
});
