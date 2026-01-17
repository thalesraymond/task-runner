import { TaskStatus } from './TaskStatus';

/**
 * Defines the result object returned by a single task step.
 */
export interface TaskResult {
  /** The final status of the task. */
  status: TaskStatus;
  /** An optional message, typically used for success statuses. */
  message?: string;
  /** An optional error message, typically used for failure statuses. */
  error?: string;
  /** Optional data produced by the step for later inspection. */
  data?: unknown;
}
