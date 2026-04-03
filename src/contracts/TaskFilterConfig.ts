/**
 * Configuration options for filtering tasks during execution.
 */
export interface TaskFilterConfig {
  /**
   * Only execute tasks that have at least one of these tags.
   */
  includeTags?: string[];

  /**
   * Do not execute tasks that have any of these tags.
   * This takes precedence over includeTags.
   */
  excludeTags?: string[];

  /**
   * Only execute tasks with these exact names.
   */
  includeNames?: string[];

  /**
   * Do not execute tasks with these exact names.
   * This takes precedence over includeNames.
   */
  excludeNames?: string[];

  /**
   * If true, recursively include all tasks that the explicitly selected tasks depend on.
   * Default is false.
   */
  includeDependencies?: boolean;
}
