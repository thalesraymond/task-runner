import { Plugin, PluginContext } from "../contracts/Plugin.js";

/**
 * A plugin that reports task execution progress and summarizes results in the CLI.
 */
export class CLIReporterPlugin<TContext> implements Plugin<TContext> {
  public readonly name = "cli-reporter";
  public readonly version = "1.0.0";

  private startTime = 0;
  private successCount = 0;
  private failureCount = 0;
  private skippedCount = 0;

  public install(context: PluginContext<TContext>): void {
    context.events.on("workflowStart", () => {
      this.startTime = performance.now();
      this.successCount = 0;
      this.failureCount = 0;
      this.skippedCount = 0;
      console.log("\n🚀 Starting TaskRunner workflow...");
    });

    context.events.on("taskStart", ({ step }) => {
      console.log(`⏳ Starting: ${step.name}`);
    });

    context.events.on("taskEnd", ({ step, result }) => {
      if (result.status === "success") {
        this.successCount++;
        console.log(`✅ Success: ${step.name}`);
      } else {
        this.failureCount++;
        console.log(`❌ Failed:  ${step.name}${result.error ? ` - ${result.error}` : ""}`);
      }
    });

    context.events.on("taskSkipped", ({ step, result }) => {
      this.skippedCount++;
      const reason = result.error ? ` - ${result.error}` : "";
      console.log(`⏭️  Skipped: ${step.name}${reason}`);
    });

    context.events.on("workflowEnd", () => {
      const duration = performance.now() - this.startTime;
      console.log(`\n🏁 Workflow Completed in ${duration.toFixed(2)}ms`);
      console.log("📊 Summary:");
      console.log(`   ✅ Success: ${this.successCount}`);
      console.log(`   ❌ Failed:  ${this.failureCount}`);
      console.log(`   ⏭️  Skipped: ${this.skippedCount}\n`);
    });
  }
}
