import { describe, it, expect } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";
import { TaskResult } from "../src/TaskResult.js";

// --- Context Definitions ---

interface BaseContext {
  runId: string;
}

interface StepAContext extends BaseContext {
  stepAData: string;
}

interface StepBContext extends BaseContext {
  stepBData: string;
}

interface StepCContext extends BaseContext {
  stepCData: string;
}

interface StepDContext extends BaseContext {
  stepDData: string;
}

interface StepEContext extends BaseContext {
  stepEData: string;
}

interface StepFContext extends BaseContext {
  stepFData: string;
}

interface StepGContext extends BaseContext {
  stepGData: string;
}

// The "Full" context is what the runner will eventually hold,
// but steps will only see what they need or what they add.
type FullContext = BaseContext &
  Partial<StepAContext> &
  Partial<StepBContext> &
  Partial<StepCContext> &
  Partial<StepDContext> &
  Partial<StepEContext> &
  Partial<StepFContext> &
  Partial<StepGContext>;

describe("Complex Scenario Integration Tests", () => {
  // Helper to create steps more concisely while preserving the spirit of the pattern
  const createStep = <TRequired>(
    name: string,
    dependencies: string[] | undefined,
    action: (ctx: TRequired & FullContext) => void,
    shouldFail = false
  ): TaskStep<FullContext> => {
    return {
      name,
      dependencies,
      run: async (ctx: FullContext): Promise<TaskResult> => {
        if (shouldFail) {
          return { status: "failure", error: `${name} failed intentionally` };
        }
        try {
          // In a real scenario, we would cast or assert ctx has TRequired here
          action(ctx as TRequired & FullContext);
          return { status: "success", message: `${name} succeeded` };
        } catch (error) {
          return { status: "failure", error: String(error) };
        }
      },
    };
  };

  it("1. All steps execute when all succeed and context is hydrated", async () => {
    const context: FullContext = { runId: "test-run-1" };
    const runner = new TaskRunner(context);

    // Step A: Hydrates StepAContext
    const StepA = createStep<BaseContext & Partial<StepAContext>>(
      "StepA",
      undefined,
      (ctx) => {
        console.log("Running StepA");
        ctx.stepAData = "dataA";
      }
    );

    // Step B: Hydrates StepBContext
    const StepB = createStep<BaseContext & Partial<StepBContext>>(
      "StepB",
      undefined,
      (ctx) => {
        console.log("Running StepB");
        ctx.stepBData = "dataB";
      }
    );

    // Step C: Hydrates StepCContext
    const StepC = createStep<BaseContext & Partial<StepCContext>>(
      "StepC",
      undefined,
      (ctx) => {
        console.log("Running StepC");
        ctx.stepCData = "dataC";
      }
    );

    // Step D: Depends on A, requires StepAContext, hydrates StepDContext
    const StepD = createStep<StepAContext & Partial<StepDContext>>(
      "StepD",
      ["StepA"],
      (ctx) => {
        console.log("Running StepD");
        if (!ctx.stepAData) throw new Error("Missing stepAData");
        ctx.stepDData = "dataD";
      }
    );

    // Step E: Depends on A, B, D. Requires their contexts. Hydrates StepEContext
    const StepE = createStep<
      StepAContext & StepBContext & StepDContext & Partial<StepEContext>
    >("StepE", ["StepA", "StepB", "StepD"], (ctx) => {
      console.log("Running StepE");
      if (!ctx.stepAData) throw new Error("Missing stepAData");
      if (!ctx.stepBData) throw new Error("Missing stepBData");
      if (!ctx.stepDData) throw new Error("Missing stepDData");
      ctx.stepEData = "dataE";
    });

    // Step F: Depends on C, requires StepCContext, hydrates StepFContext
    const StepF = createStep<StepCContext & Partial<StepFContext>>(
      "StepF",
      ["StepC"],
      (ctx) => {
        console.log("Running StepF");
        if (!ctx.stepCData) throw new Error("Missing stepCData");
        ctx.stepFData = "dataF";
      }
    );

    // Step G: Depends on F, requires StepFContext, hydrates StepGContext
    const StepG = createStep<StepFContext & Partial<StepGContext>>(
      "StepG",
      ["StepF"],
      (ctx) => {
        console.log("Running StepG");
        if (!ctx.stepFData) throw new Error("Missing stepFData");
        ctx.stepGData = "dataG";
      }
    );

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
      runId: "test-run-1",
      stepAData: "dataA",
      stepBData: "dataB",
      stepCData: "dataC",
      stepDData: "dataD",
      stepEData: "dataE",
      stepFData: "dataF",
      stepGData: "dataG",
    });
  });

  it("2. The 'skip' propagation works as intended if something breaks up in the tree", async () => {
    const context: FullContext = { runId: "test-run-2" };
    const runner = new TaskRunner(context);

    // StepA will fail
    const StepA = createStep<BaseContext & Partial<StepAContext>>(
      "StepA",
      undefined,
      (ctx) => {
        ctx.stepAData = "dataA";
      },
      true
    );

    const StepB = createStep<BaseContext & Partial<StepBContext>>(
      "StepB",
      undefined,
      (ctx) => {
        ctx.stepBData = "dataB";
      }
    );

    const StepC = createStep<BaseContext & Partial<StepCContext>>(
      "StepC",
      undefined,
      (ctx) => {
        ctx.stepCData = "dataC";
      }
    );

    const StepD = createStep<StepAContext & Partial<StepDContext>>(
      "StepD",
      ["StepA"],
      (ctx) => {
        ctx.stepDData = "dataD";
      }
    );

    const StepE = createStep<
      StepAContext & StepBContext & StepDContext & Partial<StepEContext>
    >("StepE", ["StepA", "StepB", "StepD"], (ctx) => {
      ctx.stepEData = "dataE";
    });

    const StepF = createStep<StepCContext & Partial<StepFContext>>(
      "StepF",
      ["StepC"],
      (ctx) => {
        ctx.stepFData = "dataF";
      }
    );

    const StepG = createStep<StepFContext & Partial<StepGContext>>(
      "StepG",
      ["StepF"],
      (ctx) => {
        ctx.stepGData = "dataG";
      }
    );

    const steps = [StepA, StepB, StepC, StepD, StepE, StepF, StepG];
    const results = await runner.execute(steps);

    // Assertions
    expect(results.get("StepA")?.status).toBe("failure");
    expect(results.get("StepB")?.status).toBe("success");
    expect(results.get("StepC")?.status).toBe("success");

    // StepD depends on A
    expect(results.get("StepD")?.status).toBe("skipped");
    expect(results.get("StepD")?.message).toContain("StepA");

    // StepE depends on A, B, D.
    expect(results.get("StepE")?.status).toBe("skipped");

    // StepF depends on C (success)
    expect(results.get("StepF")?.status).toBe("success");

    // StepG depends on F (success)
    expect(results.get("StepG")?.status).toBe("success");

    // Verify context - A, D, E data should be missing
    expect(context.stepAData).toBeUndefined();
    expect(context.stepDData).toBeUndefined();
    expect(context.stepEData).toBeUndefined();
    expect(context.stepBData).toBe("dataB");
    expect(context.stepCData).toBe("dataC");
    expect(context.stepFData).toBe("dataF");
    expect(context.stepGData).toBe("dataG");
  });
});
