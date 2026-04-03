/**
 * Configuration options for filtering tasks before execution.
 */
export interface TaskFilterConfig {
  /**
   * Only include tasks that match any of these tags.
   */
  includeTags?: string[];
  /**
   * Exclude tasks that match any of these tags, overriding inclusions.
   */
  excludeTags?: string[];
  /**
   * Only include tasks with these specific names.
   */
  includeNames?: string[];
  /**
   * Exclude tasks with these specific names, overriding inclusions.
   */
  excludeNames?: string[];
  /**
   * If true (default), automatically include all necessary dependencies
   * of the selected tasks, unless those dependencies are explicitly excluded.
   */
  includeDependencies?: boolean;
}
