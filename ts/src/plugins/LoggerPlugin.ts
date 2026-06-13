import { Plugin, PluginContext } from "../contracts/Plugin.js";

export interface LoggerPluginOptions {
  format: "text" | "json";
}

export class LoggerPlugin<TContext> implements Plugin<TContext> {
  public readonly name = "logger";
  public readonly version = "1.0.0";
  private readonly format: "text" | "json";

  constructor(options: LoggerPluginOptions) {
    this.format = options.format;
  }

  public install(context: PluginContext<TContext>): void {
    context.events.on("workflowStart", (payload) => {
      if (this.format === "text") {
        console.log(`[WorkflowStart] Starting workflow with ${payload.steps.length} steps.`);
      } else {
        console.log(
          JSON.stringify({
            event: "workflowStart",
            timestamp: new Date().toISOString(),
            stepCount: payload.steps.length,
          })
        );
      }
    });

    context.events.on("workflowEnd", (payload) => {
      if (this.format === "text") {
        let successCount = 0;
        let failedCount = 0;
        for (const result of payload.results.values()) {
          if (result.status === "success") { successCount++; }
          else if (result.status === "failure") { failedCount++; }
        }
        console.log(`[WorkflowEnd] Workflow completed. Success: ${successCount}, Failed: ${failedCount}.`);
      } else {
        const statusSummary: Record<string, string> = {};
        for (const [name, result] of payload.results) {
          statusSummary[name] = result.status;
        }
        console.log(
          JSON.stringify({
            event: "workflowEnd",
            timestamp: new Date().toISOString(),
            totalTasks: payload.results.size,
            statusSummary,
          })
        );
      }
    });

    context.events.on("taskStart", (payload) => {
      if (this.format === "text") {
        console.log(`[TaskStart] Task '${payload.step.name}' started.`);
      } else {
        console.log(
          JSON.stringify({
            event: "taskStart",
            timestamp: new Date().toISOString(),
            task: payload.step.name,
          })
        );
      }
    });

    context.events.on("taskEnd", (payload) => {
      const duration = payload.result.metrics?.duration;

      if (this.format === "text") {
        const durStr = duration === undefined ? "" : ` in ${duration}ms`;
        console.log(`[TaskEnd] Task '${payload.step.name}' ended with status '${payload.result.status}'${durStr}.`);
      } else {
        console.log(
          JSON.stringify({
            event: "taskEnd",
            timestamp: new Date().toISOString(),
            task: payload.step.name,
            status: payload.result.status,
            duration: duration,
          })
        );
      }
    });

    context.events.on("taskSkipped", (payload) => {
      if (this.format === "text") {
        console.log(`[TaskSkipped] Task '${payload.step.name}' skipped.`);
      } else {
        console.log(
          JSON.stringify({
            event: "taskSkipped",
            timestamp: new Date().toISOString(),
            task: payload.step.name,
            status: "skipped",
          })
        );
      }
    });
  }
}
