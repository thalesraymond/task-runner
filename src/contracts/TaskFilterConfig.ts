/**
 * Configuration options for filtering tasks during execution.
 */
export interface TaskFilterConfig {
  /**
   * Run only tasks with these tags.
   */
  includeTags?: string[];
  /**
   * Exclude tasks with these tags.
   */
  excludeTags?: string[];
  /**
   * Run only tasks with these names.
   */
  includeNames?: string[];
  /**
   * Exclude tasks with these names.
   */
  excludeNames?: string[];
  /**
   * If true, automatically include dependencies of selected tasks.
   * Default is false.
   */
  includeDependencies?: boolean;
}
