import { describe, it, expect, vi } from "vitest";
import { TaskRunnerBuilder } from "../src/TaskRunnerBuilder.js";

describe("TaskRunnerBuilder mutants", () => {
  it("should initialize listeners correctly on multiple on() calls", () => {
    const builder = new TaskRunnerBuilder({});
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    // Call "on" twice. If listeners[event] = [] mutated to ["Stryker was here"], it will push to it.
    builder.on("taskStart", cb1);
    builder.on("taskStart", cb2);

    const runner = builder.build();
    // @ts-expect-error accessing private property
    const runnerListeners = runner.eventBus.listeners.taskStart;

    // There shouldn't be 'Stryker was here' among listeners
    expect(runnerListeners).toHaveLength(2);
    expect(runnerListeners).toContain(cb1);
    expect(runnerListeners).toContain(cb2);
  });

  it("should not use LoggerPlugin if loggerFormat is undefined", () => {
    const builder = new TaskRunnerBuilder({});
    const runner = builder.build();

    // We can verify that plugin is not used by checking private plugins array length
    // @ts-expect-error accessing private property
    expect(runner.pluginManager.plugins).toHaveLength(0);
  });

  it("should correctly assign context in constructor", () => {
    const ctx = { testContext: "abc" };
    const builder = new TaskRunnerBuilder(ctx);
    const runner = builder.build();

    // @ts-expect-error accessing private property
    expect(runner.context).toBe(ctx);
  });

  it("should fallback to RetryingExecutionStrategy(StandardExecutionStrategy) if no strategy is provided", () => {
    const builder = new TaskRunnerBuilder({});
    const runner = builder.build();

    // The executionStrategy applied is LoopingExecutionStrategy
    // And its inner strategy should be RetryingExecutionStrategy, which inner strategy is StandardExecutionStrategy
    // @ts-expect-error accessing private property
    const loopStrategy = runner.executionStrategy as unknown;
    expect((loopStrategy as { constructor: { name: string } }).constructor.name).toBe("LoopingExecutionStrategy");
    expect((loopStrategy as { innerStrategy: { constructor: { name: string } } }).innerStrategy.constructor.name).toBe("RetryingExecutionStrategy");
    expect((loopStrategy as { innerStrategy: { innerStrategy: { constructor: { name: string } } } }).innerStrategy.innerStrategy.constructor.name).toBe("StandardExecutionStrategy");
  });
});
