
import { describe, it } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";

describe("TaskRunner Performance Benchmark", () => {
  it("should demonstrate performance improvement in long tail scenarios", async () => {
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

    // Scenario:
    // 1. SlowTask: 500ms
    // 2. Chain of 5 tasks, each 50ms. Total chain time 250ms.
    //
    // Current Implementation:
    // Iteration 1: Start SlowTask, Chain1. Wait 500ms (max of batch).
    // Iteration 2: Start Chain2. Wait 50ms.
    // Iteration 3: Start Chain3. Wait 50ms.
    // ...
    // Total time ~= 500ms + 4 * 50ms = 700ms.
    //
    // Optimized Implementation:
    // Start SlowTask, Chain1.
    // Chain1 finishes at 50ms -> Chain2 starts.
    // Chain2 finishes at 100ms -> Chain3 starts.
    // ...
    // Chain5 finishes at 250ms.
    // SlowTask finishes at 500ms.
    // Total time ~= 500ms.

    const steps: TaskStep<unknown>[] = [
      {
        name: "SlowTask",
        run: async () => {
          await delay(500);
          return { status: "success" };
        }
      },
      {
        name: "Chain1",
        run: async () => {
          await delay(50);
          return { status: "success" };
        }
      }
    ];

    for (let i = 2; i <= 5; i++) {
        steps.push({
            name: `Chain${i}`,
            dependencies: [`Chain${i-1}`],
            run: async () => {
                await delay(50);
                return { status: "success" };
            }
        });
    }

    const runner = new TaskRunner({});
    const startTime = Date.now();
    await runner.execute(steps);
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`Execution took ${duration}ms`);

    // We expect it to be closer to 700ms with current implementation
    // and close to 500ms with optimized implementation.
  });
});
