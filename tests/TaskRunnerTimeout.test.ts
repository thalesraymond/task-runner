import { describe, it, expect } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";

describe("TaskRunner - Global Timeout", () => {
  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  it("should stop workflow when global timeout is reached", async () => {
    const executedSteps: string[] = [];
    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        run: async () => {
          await delay(200); // Exceeds timeout of 100ms
          executedSteps.push("A");
          return { status: "success" };
        },
      },
      {
        name: "B",
        dependencies: ["A"],
        run: async () => {
          executedSteps.push("B");
          return { status: "success" };
        },
      },
    ];

    const runner = new TaskRunner({});
    const results = await runner.execute(steps, { timeout: 100 });

    // "A" might or might not push to executedSteps depending on whether it checks signal,
    // but here it doesn't check signal, so it continues running.
    // However, the TaskRunner should return results with "cancelled" status.
    // Wait, if A doesn't check signal, it will finish.
    // But TaskRunner logic for timeout should probably abort the signal passed to tasks.

    // The spec SC-002 says: "MUST terminate within 200ms of the timeout duration being reached."
    // If the task ignores signal, we can't force it to stop.
    // But TaskRunner should behave correctly regarding results.

    expect(results.get("B")?.status).toBe("cancelled");

    // In this test case, A runs for 200ms. Timeout is 100ms.
    // The `execute` method should return after 100ms (approx).
    // And A should be marked... what?
    // If A is still running, `execute` cannot return unless it detaches?
    // But we await `Promise.all`.
    // If we want to enforce timeout, we need to race against the timeout.

    // This implies `execute` implementation needs to handle the timeout promise.
  });

  it("should propagate timeout cancellation to TaskStep.run method", async () => {
    let receivedSignal: AbortSignal | undefined;
    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        run: async (context, signal) => {
          receivedSignal = signal;
          await delay(200);
          return { status: "success" };
        },
      },
    ];

    const runner = new TaskRunner({});
    const promise = runner.execute(steps, { timeout: 50 });

    // We expect execute to finish around 50ms.
    // We can't easily await it if the task sleeps 200ms unless the task respects the signal.
    // But here the task DOES NOT check signal.aborted, it just stores it.

    // Wait, if the task doesn't respect signal, `execute` will wait for 200ms?
    // Unless `execute` implements `Promise.race([tasks, timeout])`.
    // If `execute` implements `Promise.race`, then it returns early.
    // But the tasks keep running in background.

    // Let's assume the implementation will use `AbortSignal.timeout` or similar combined with an internal signal.

    await promise;

    expect(receivedSignal).toBeDefined();
    expect(receivedSignal?.aborted).toBe(true);
  });

  it("should mark unstarted tasks as 'cancelled' upon timeout", async () => {
    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        run: async (context, signal) => {
           // Respect signal to exit early
           if (signal?.aborted) return { status: "cancelled" };
           await delay(200);
           return { status: "success" };
        }
      },
      {
        name: "B",
        dependencies: ["A"],
        run: async () => ({ status: "success" })
      }
    ];

    const runner = new TaskRunner({});
    const results = await runner.execute(steps, { timeout: 100 });

    expect(results.get("B")?.status).toBe("cancelled");
  });
});
