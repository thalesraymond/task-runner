export interface TaskFilterConfig {
  /** Include tasks with any of these tags. */
  includeTags?: string[];
  /** Exclude tasks with any of these tags. */
  excludeTags?: string[];
  /** Include tasks with these specific names. */
  includeNames?: string[];
  /** Exclude tasks with these specific names. */
  excludeNames?: string[];
  /** If true, recursively includes dependencies of selected tasks. */
  includeDependencies?: boolean;
}
