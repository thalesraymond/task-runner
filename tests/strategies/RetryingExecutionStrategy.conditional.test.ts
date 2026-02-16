import { describe, it, expect } from "vitest";
import { RetryingExecutionStrategy } from "../../src/strategies/RetryingExecutionStrategy.js";
import { IExecutionStrategy } from "../../src/strategies/IExecutionStrategy.js";
import { TaskStep } from "../../src/TaskStep.js";

describe("RetryingExecutionStrategy Conditional Retries", () => {
  it("should retry if shouldRetry returns true", async () => {
    let callCount = 0;
    const innerStrategy: IExecutionStrategy<unknown> = {
      execute: async () => {
        callCount++;
        if (callCount < 2) {
          return { status: "failure", error: "fail" };
        }
        return { status: "success" };
      },
    };

    const strategy = new RetryingExecutionStrategy(innerStrategy);
    const step: TaskStep<unknown> = {
      name: "task",
      run: async () => ({ status: "success" }),
      retry: {
        attempts: 3,
        delay: 10,
        shouldRetry: () => true,
      },
    };

    const result = await strategy.execute(step, {});
    expect(result.status).toBe("success");
    expect(callCount).toBe(2);
  });

  it("should not retry if shouldRetry returns false", async () => {
    let callCount = 0;
    const innerStrategy: IExecutionStrategy<unknown> = {
      execute: async () => {
        callCount++;
        return { status: "failure", error: "fatal" };
      },
    };

    const strategy = new RetryingExecutionStrategy(innerStrategy);
    const step: TaskStep<unknown> = {
      name: "task",
      run: async () => ({ status: "success" }),
      retry: {
        attempts: 3,
        delay: 10,
        shouldRetry: (err) => err !== "fatal",
      },
    };

    const result = await strategy.execute(step, {});
    expect(result.status).toBe("failure");
    expect(callCount).toBe(1);
  });

  it("should retry if shouldRetry is undefined", async () => {
    let callCount = 0;
    const innerStrategy: IExecutionStrategy<unknown> = {
      execute: async () => {
        callCount++;
        if (callCount < 2) {
          return { status: "failure", error: "fail" };
        }
        return { status: "success" };
      },
    };

    const strategy = new RetryingExecutionStrategy(innerStrategy);
    const step: TaskStep<unknown> = {
      name: "task",
      run: async () => ({ status: "success" }),
      retry: {
        attempts: 3,
        delay: 10,
      },
    };

    const result = await strategy.execute(step, {});
    expect(result.status).toBe("success");
    expect(callCount).toBe(2);
  });
});
