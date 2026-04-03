import { Plugin, PluginContext } from "../contracts/Plugin.js";

/**
 * A plugin that provides real-time CLI observability of workflow progress.
 * It hooks into lifecycle events to display task states and a final summary.
 */
export class CLIReporterPlugin<TContext> implements Plugin<TContext> {
  public readonly name = "cli-reporter";
  public readonly version = "1.0.0";

  private startTime = 0;
  private successful = 0;
  private failed = 0;
  private skipped = 0;

  public install(context: PluginContext<TContext>): void {
    context.events.on("workflowStart", () => {
      this.startTime = performance.now();
      this.successful = 0;
      this.failed = 0;
      this.skipped = 0;
    });

    context.events.on("taskStart", ({ step }) => {
      console.log(`[RUNNING] Task ${step.name}`);
    });

    context.events.on("taskEnd", ({ step, result }) => {
      if (result.status === "success") {
        this.successful++;
        const durationStr = result.metrics?.duration !== undefined ? ` (${Math.round(result.metrics.duration)}ms)` : "";
        console.log(`[SUCCESS] Task ${step.name}${durationStr}`);
      } else if (result.status === "failure") {
        this.failed++;
        const errorMsg = result.error ? ` - ${result.error}` : "";
        console.log(`[FAILURE] Task ${step.name}${errorMsg}`);
      } else if (result.status === "cancelled") {
        // According to the spec we track skipped, but cancelled is another status.
        // Will just increment failed for now or leave it. We'll track it as skipped.
        this.skipped++;
        console.log(`[CANCELLED] Task ${step.name}`);
      } else {
        this.skipped++;
        console.log(`[SKIPPED] Task ${step.name}`);
      }
    });

    context.events.on("taskSkipped", ({ step }) => {
      this.skipped++;
      console.log(`[SKIPPED] Task ${step.name}`);
    });

    context.events.on("workflowEnd", () => {
      const endTime = performance.now();
      const totalTime = endTime - this.startTime;

      console.log("--- Workflow Execution Summary ---");
      console.log(`Total Time: ${Math.round(totalTime)}ms`);
      console.log(`Successful: ${this.successful}`);
      console.log(`Failed: ${this.failed}`);
      console.log(`Skipped: ${this.skipped}`);
      console.log("----------------------------------");
    });
  }
}
