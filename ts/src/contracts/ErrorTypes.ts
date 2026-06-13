/**
 * Error type constants for task graph validation.
 */
export const ERROR_DUPLICATE_TASK = "duplicate_task" as const;
export const ERROR_MISSING_DEPENDENCY = "missing_dependency" as const;
export const ERROR_CYCLE = "cycle" as const;
