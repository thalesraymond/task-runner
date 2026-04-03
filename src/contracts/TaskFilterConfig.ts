export interface TaskFilterConfig {
  /**
   * Only run tasks that have at least one tag matching this list.
   */
  includeTags?: string[];
  /**
   * Do not run tasks that have at least one tag matching this list.
   * Exclusion rules take precedence over inclusion rules.
   */
  excludeTags?: string[];
  /**
   * Only run tasks whose names match this list.
   */
  includeNames?: string[];
  /**
   * Do not run tasks whose names match this list.
   * Exclusion rules take precedence over inclusion rules.
   */
  excludeNames?: string[];
  /**
   * If true, the filter will recursively include all tasks that the selected tasks depend on.
   */
  includeDependencies?: boolean;
}
