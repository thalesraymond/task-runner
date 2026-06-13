import { describe, it, expect } from "vitest";
import { WorkflowExecutor } from "../src/WorkflowExecutor.js";
import { EventBus } from "../src/EventBus.js";
import { TaskStateManager } from "../src/TaskStateManager.js";
import { StandardExecutionStrategy } from "../src/strategies/StandardExecutionStrategy.js";

describe("WorkflowExecutor Events Mutant", () => {
  it("kills mutants related to workflowStart and workflowEnd events on lines 41, 50, 109", async () => {
    const eventBus = new EventBus<unknown>();
    const stateManager = new TaskStateManager(eventBus);
    const strategy = new StandardExecutionStrategy();

    let startEmitted = false;
    let endEmitted = false;

    let startPropsCorrect = false;
    let endPropsCorrect = false;

    eventBus.on("workflowStart", (data) => {
        startEmitted = true;
        if (data.context && data.steps) startPropsCorrect = true;
    });

    eventBus.on("workflowEnd", (data) => {
        endEmitted = true;
        if (data.context && data.results) endPropsCorrect = true;
    });

    const executor = new WorkflowExecutor({}, eventBus, stateManager, strategy);
    await executor.execute([]);

    expect(startEmitted).toBe(true);
    expect(startPropsCorrect).toBe(true);
    expect(endEmitted).toBe(true);
    expect(endPropsCorrect).toBe(true);
  });

  it("kills workflowEnd mutant in immediate abort on line 50", async () => {
    const eventBus = new EventBus<unknown>();
    const stateManager = new TaskStateManager(eventBus);
    const strategy = new StandardExecutionStrategy();

    let endPropsCorrect = false;
    let correctEventEmitted = false;

    eventBus.on("workflowEnd", (data) => {
        correctEventEmitted = true;
        if (data.context && data.results) endPropsCorrect = true;
    });

    const controller = new AbortController();
    controller.abort();

    const executor = new WorkflowExecutor({}, eventBus, stateManager, strategy);
    await executor.execute([{ name: "A", run: async () => ({ status: "success" }) }], controller.signal);

    expect(correctEventEmitted).toBe(true);
    expect(endPropsCorrect).toBe(true);
  });
});
