/**
 * Configuration options for filtering tasks before execution.
 */
export interface TaskFilterConfig {
  /**
   * Only include tasks that have at least one of these tags.
   */
  includeTags?: string[];
  /**
   * Exclude tasks that have any of these tags.
   */
  excludeTags?: string[];
  /**
   * Only include tasks with these specific names.
   */
  includeNames?: string[];
  /**
   * Exclude tasks with these specific names.
   */
  excludeNames?: string[];
  /**
   * If true, dependencies of included tasks will also be included automatically.
   * Default is false.
   */
  includeDependencies?: boolean;
}
