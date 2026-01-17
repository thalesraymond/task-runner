import { describe, it, expect } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";
import { TaskResult } from "../src/TaskResult.js";

type TestContext = Record<string, string>;

describe("Complex Scenario Integration Tests", () => {
  const createStep = (
    name: string,
    dependencies: string[] | undefined,
    action: (ctx: TestContext) => void,
    shouldFail = false
  ): TaskStep<TestContext> => {
    return {
      name,
      dependencies,
      run: async (ctx: TestContext): Promise<TaskResult> => {
        if (shouldFail) {
          return { status: "failure", error: `${name} failed intentionally` };
        }
        try {
          action(ctx);
          return { status: "success", message: `${name} succeeded` };
        } catch (error) {
           return { status: "failure", error: String(error) };
        }
      },
    };
  };

  it("1. All steps execute when all succeed and context is hydrated", async () => {
    const context: TestContext = {};
    const runner = new TaskRunner(context);

    // Step definitions
    const StepA = createStep("StepA", undefined, (ctx) => {
      console.log("Running StepA");
      ctx.stepA = "dataA";
    });

    const StepB = createStep("StepB", undefined, (ctx) => {
      console.log("Running StepB");
      ctx.stepB = "dataB";
    });

    const StepC = createStep("StepC", undefined, (ctx) => {
      console.log("Running StepC");
      ctx.stepC = "dataC";
    });

    const StepD = createStep("StepD", ["StepA"], (ctx) => {
      console.log("Running StepD");
      if (!ctx.stepA) throw new Error("Missing dependency data from StepA");
      ctx.stepD = "dataD";
    });

    const StepE = createStep("StepE", ["StepA", "StepB", "StepD"], (ctx) => {
      console.log("Running StepE");
      if (!ctx.stepA) throw new Error("Missing dependency data from StepA");
      if (!ctx.stepB) throw new Error("Missing dependency data from StepB");
      if (!ctx.stepD) throw new Error("Missing dependency data from StepD");
      ctx.stepE = "dataE";
    });

    const StepF = createStep("StepF", ["StepC"], (ctx) => {
      console.log("Running StepF");
      if (!ctx.stepC) throw new Error("Missing dependency data from StepC");
      ctx.stepF = "dataF";
    });

    const StepG = createStep("StepG", ["StepF"], (ctx) => {
      console.log("Running StepG");
      if (!ctx.stepF) throw new Error("Missing dependency data from StepF");
      ctx.stepG = "dataG";
    });

    const steps = [StepA, StepB, StepC, StepD, StepE, StepF, StepG];
    const results = await runner.execute(steps);

    // Assertions
    expect(results.get("StepA")?.status).toBe("success");
    expect(results.get("StepB")?.status).toBe("success");
    expect(results.get("StepC")?.status).toBe("success");
    expect(results.get("StepD")?.status).toBe("success");
    expect(results.get("StepE")?.status).toBe("success");
    expect(results.get("StepF")?.status).toBe("success");
    expect(results.get("StepG")?.status).toBe("success");

    expect(context).toEqual({
      stepA: "dataA",
      stepB: "dataB",
      stepC: "dataC",
      stepD: "dataD",
      stepE: "dataE",
      stepF: "dataF",
      stepG: "dataG",
    });
  });

  it("2. The 'skip' propagation works as intended if something breaks up in the tree", async () => {
    const context: TestContext = {};
    const runner = new TaskRunner(context);

    // Step definitions - StepA will fail
    const StepA = createStep("StepA", undefined, (ctx) => {
      ctx.stepA = "dataA";
    }, true); // Fail this step

    const StepB = createStep("StepB", undefined, (ctx) => {
      ctx.stepB = "dataB";
    });

    const StepC = createStep("StepC", undefined, (ctx) => {
      ctx.stepC = "dataC";
    });

    const StepD = createStep("StepD", ["StepA"], (ctx) => {
        // Should not run
      ctx.stepD = "dataD";
    });

    const StepE = createStep("StepE", ["StepA", "StepB", "StepD"], (ctx) => {
        // Should not run
      ctx.stepE = "dataE";
    });

    const StepF = createStep("StepF", ["StepC"], (ctx) => {
      ctx.stepF = "dataF";
    });

    const StepG = createStep("StepG", ["StepF"], (ctx) => {
      ctx.stepG = "dataG";
    });

    const steps = [StepA, StepB, StepC, StepD, StepE, StepF, StepG];
    const results = await runner.execute(steps);

    // Assertions
    expect(results.get("StepA")?.status).toBe("failure");
    expect(results.get("StepB")?.status).toBe("success");
    expect(results.get("StepC")?.status).toBe("success");

    // StepD depends on A
    expect(results.get("StepD")?.status).toBe("skipped");
    expect(results.get("StepD")?.message).toContain("StepA");

    // StepE depends on A, B, D. A failed, D skipped.
    // The runner logic usually skips if any dependency is not success.
    expect(results.get("StepE")?.status).toBe("skipped");

    // StepF depends on C (success)
    expect(results.get("StepF")?.status).toBe("success");

    // StepG depends on F (success)
    expect(results.get("StepG")?.status).toBe("success");

    // Verify context - A, D, E data should be missing
    expect(context.stepA).toBeUndefined();
    expect(context.stepD).toBeUndefined();
    expect(context.stepE).toBeUndefined();
    expect(context.stepB).toBe("dataB");
    expect(context.stepC).toBe("dataC");
    expect(context.stepF).toBe("dataF");
    expect(context.stepG).toBe("dataG");
  });
});
