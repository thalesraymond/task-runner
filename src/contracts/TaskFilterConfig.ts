/**
 * Configuration options for filtering tasks during execution.
 */
export interface TaskFilterConfig {
  /** Include tasks with any of these tags. */
  includeTags?: string[];
  /** Exclude tasks with any of these tags. Exclusions take precedence over inclusions. */
  excludeTags?: string[];
  /** Include tasks with any of these names. */
  includeNames?: string[];
  /** Exclude tasks with any of these names. Exclusions take precedence over inclusions. */
  excludeNames?: string[];
  /** If true, also include all necessary dependencies of the explicitly included tasks. */
  includeDependencies?: boolean;
}
