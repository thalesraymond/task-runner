import { describe, it, expect, vi } from "vitest";
import { WorkflowExecutor } from "../src/WorkflowExecutor.js";
import { EventBus } from "../src/EventBus.js";
import { TaskStep } from "../src/TaskStep.js";
import { TaskStateManager } from "../src/TaskStateManager.js";
import { StandardExecutionStrategy } from "../src/strategies/StandardExecutionStrategy.js";

describe("WorkflowExecutor Conditional Execution", () => {
    it("should execute task when condition is undefined", async () => {
        const eventBus = new EventBus<unknown>();
        const stateManager = new TaskStateManager(eventBus);
        const strategy = new StandardExecutionStrategy();

        const steps: TaskStep<unknown>[] = [{
            name: "A",
            run: async () => ({ status: "success" })
        }];

        const executor = new WorkflowExecutor({}, eventBus, stateManager, strategy);
        const results = await executor.execute(steps);
        expect(results.get("A")?.status).toBe("success");
    });

    it("should execute task when condition returns true", async () => {
        const eventBus = new EventBus<unknown>();
        const stateManager = new TaskStateManager(eventBus);
        const strategy = new StandardExecutionStrategy();

        const steps: TaskStep<unknown>[] = [{
            name: "A",
            condition: () => true,
            run: async () => ({ status: "success" })
        }];

        const executor = new WorkflowExecutor({}, eventBus, stateManager, strategy);
        const results = await executor.execute(steps);
        expect(results.get("A")?.status).toBe("success");
    });

    it("should skip task when condition returns false", async () => {
        const eventBus = new EventBus<unknown>();
        const stateManager = new TaskStateManager(eventBus);
        const strategy = new StandardExecutionStrategy();
        
        const runSpy = vi.fn().mockResolvedValue({ status: "success" });

        const steps: TaskStep<unknown>[] = [{
            name: "A",
            condition: () => false,
            run: runSpy
        }];

        const executor = new WorkflowExecutor({}, eventBus, stateManager, strategy);
        const results = await executor.execute(steps);
        expect(results.get("A")?.status).toBe("skipped");
        expect(runSpy).not.toHaveBeenCalled();
    });

    it("should handle async condition", async () => {
        const eventBus = new EventBus<unknown>();
        const stateManager = new TaskStateManager(eventBus);
        const strategy = new StandardExecutionStrategy();
        
        const steps: TaskStep<unknown>[] = [{
            name: "A",
            condition: async () => false,
            run: async () => ({ status: "success" })
        }];

        const executor = new WorkflowExecutor({}, eventBus, stateManager, strategy);
        const results = await executor.execute(steps);
        expect(results.get("A")?.status).toBe("skipped");
    });

    it("should skip dependent tasks if parent is skipped due to condition", async () => {
        const eventBus = new EventBus<unknown>();
        const stateManager = new TaskStateManager(eventBus);
        const strategy = new StandardExecutionStrategy();
        
        const runSpyB = vi.fn().mockResolvedValue({ status: "success" });

        const steps: TaskStep<unknown>[] = [
            {
                name: "A",
                condition: () => false,
                run: async () => ({ status: "success" })
            },
            {
                name: "B",
                dependencies: ["A"],
                run: runSpyB
            }
        ];

        const executor = new WorkflowExecutor({}, eventBus, stateManager, strategy);
        const results = await executor.execute(steps);
        
        expect(results.get("A")?.status).toBe("skipped");
        expect(results.get("B")?.status).toBe("skipped");
        expect(results.get("B")?.message).toContain("dependency 'A' failed"); // message phrasing in TaskStateManager
        expect(runSpyB).not.toHaveBeenCalled();
    });

    it("should handle condition throwing error", async () => {
        const eventBus = new EventBus<unknown>();
        const stateManager = new TaskStateManager(eventBus);
        const strategy = new StandardExecutionStrategy();
        
        const steps: TaskStep<unknown>[] = [{
            name: "A",
            condition: () => { throw new Error("Oops"); },
            run: async () => ({ status: "success" })
        }];

        const executor = new WorkflowExecutor({}, eventBus, stateManager, strategy);
        const results = await executor.execute(steps);
        expect(results.get("A")?.status).toBe("failure");
        expect(results.get("A")?.message).toBe("Oops");
    });

    it("should handle condition throwing non-Error object", async () => {
        const eventBus = new EventBus<unknown>();
        const stateManager = new TaskStateManager(eventBus);
        const strategy = new StandardExecutionStrategy();
        
        const steps: TaskStep<unknown>[] = [{
            name: "A",
            condition: () => { throw "Something went wrong"; },
            run: async () => ({ status: "success" })
        }];

        const executor = new WorkflowExecutor({}, eventBus, stateManager, strategy);
        const results = await executor.execute(steps);
        expect(results.get("A")?.status).toBe("failure");
        expect(results.get("A")?.message).toBe("Condition evaluation failed");
        expect(results.get("A")?.error).toBe("Something went wrong");
    });

    it("should handle cancellation during async condition evaluation", async () => {
        const eventBus = new EventBus<unknown>();
        const stateManager = new TaskStateManager(eventBus);
        const strategy = new StandardExecutionStrategy();
        const controller = new AbortController();

        const steps: TaskStep<unknown>[] = [{
            name: "A",
            condition: async () => {
                await new Promise(resolve => setTimeout(resolve, 20)); // Wait a bit
                return true;
            },
            run: async () => ({ status: "success" })
        }];

        const executor = new WorkflowExecutor({}, eventBus, stateManager, strategy);
        const execPromise = executor.execute(steps, controller.signal);
        
        // Abort while condition is waiting
        setTimeout(() => {
            controller.abort();
        }, 5);

        const results = await execPromise;
        expect(results.get("A")?.status).toBe("cancelled");
        expect(results.get("A")?.message).toBe("Cancelled during condition evaluation.");
    });

    it("should handle cancellation between condition and execution (or before execution if no condition)", async () => {
        const eventBus = new EventBus<unknown>();
        const stateManager = new TaskStateManager(eventBus);
        const strategy = new StandardExecutionStrategy();
        const controller = new AbortController();

        const steps: TaskStep<unknown>[] = [
            {
                name: "A",
                run: async () => {
                   await new Promise(r => setTimeout(r, 20));
                   return { status: "success" }; 
                }
            },
            {
                name: "B",
                // No dependency, so it's ready immediately
                run: async () => ({ status: "success" })
            }
        ];

        // Concurrency 1 guarantees B waits in readyQueue
        const executor = new WorkflowExecutor({}, eventBus, stateManager, strategy, 1);
        const execPromise = executor.execute(steps, controller.signal);

        // Abort during Task A
        setTimeout(() => {
            controller.abort();
        }, 5);

        const results = await execPromise;
        
        // B was in readyQueue (removed from pending), so onAbort didn't touch it.
        // It gets picked up after A finishes.
        // It sees the signal is aborted before starting execution.
        expect(results.get("B")?.status).toBe("cancelled");
        expect(results.get("B")?.message).toBe("Cancelled before execution started.");
    });

    it("should handle immediate cancellation", async () => {
        const eventBus = new EventBus<unknown>();
        const stateManager = new TaskStateManager(eventBus);
        const strategy = new StandardExecutionStrategy();
        const controller = new AbortController();
        controller.abort(); // Pre-abort

        const steps: TaskStep<unknown>[] = [{
            name: "A",
            run: async () => ({ status: "success" })
        }];

        const executor = new WorkflowExecutor({}, eventBus, stateManager, strategy);
        const results = await executor.execute(steps, controller.signal);

        expect(results.get("A")?.status).toBe("cancelled");
        expect(results.get("A")?.message).toBe("Workflow cancelled before execution started.");
    });

    it("should break loop if stuck (e.g. cycle)", async () => {
        const eventBus = new EventBus<unknown>();
        const stateManager = new TaskStateManager(eventBus);
        const strategy = new StandardExecutionStrategy();

        // Cycle: A -> B -> A
        const steps: TaskStep<unknown>[] = [
            {
                name: "A",
                dependencies: ["B"],
                run: async () => ({ status: "success" })
            },
            {
                name: "B",
                dependencies: ["A"],
                run: async () => ({ status: "success" })
            }
        ];

        const executor = new WorkflowExecutor({}, eventBus, stateManager, strategy);
        
        // This should not hang, but finish with pending tasks unresolved (or handled by break)
        // Check if it returns.
        const results = await executor.execute(steps);
        
        // Both remain pending (or cancelled by safety cleanup at end)
        // WorkflowExecutor cancels all pending at end of execution if loop exits.
        expect(results.get("A")?.status).toBe("cancelled");
        expect(results.get("B")?.status).toBe("cancelled");
    });
});
