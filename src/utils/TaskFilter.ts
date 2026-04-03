import { TaskStep } from "../TaskStep.js";
import { TaskFilterConfig } from "../contracts/TaskFilterConfig.js";

/**
 * Filters a list of task steps based on a provided configuration.
 *
 * @param steps The original list of tasks.
 * @param config The filter configuration defining inclusion/exclusion rules.
 * @returns A new array containing only the tasks that match the filter criteria.
 */
export function filterTasks<TContext>(
  steps: TaskStep<TContext>[],
  config: TaskFilterConfig
): TaskStep<TContext>[] {
  const {
    includeTags,
    excludeTags,
    includeNames,
    excludeNames,
    includeDependencies,
  } = config;

  // Step 1: Initial filtering based on inclusion/exclusion rules
  let filteredSteps = steps.filter((step) => {
    // Exclusion takes precedence
    if (excludeNames && excludeNames.includes(step.name)) {
      return false;
    }
    if (excludeTags && step.tags?.some((tag) => excludeTags.includes(tag))) {
      return false;
    }

    // If there are inclusion rules, the step MUST match at least one
    const hasIncludeRules =
      (includeNames && includeNames.length > 0) ||
      (includeTags && includeTags.length > 0);

    if (hasIncludeRules) {
      const matchesName = includeNames ? includeNames.includes(step.name) : false;
      const matchesTag = includeTags
        ? step.tags?.some((tag) => includeTags.includes(tag)) ?? false
        : false;

      if (!matchesName && !matchesTag) {
        return false;
      }
    }

    return true;
  });

  // Step 2: Include dependencies if configured
  if (includeDependencies) {
    const includedNames = new Set<string>(filteredSteps.map((s) => s.name));
    const stepMap = new Map<string, TaskStep<TContext>>();
    for (const step of steps) {
      stepMap.set(step.name, step);
    }

    let changed = true;
    while (changed) {
      changed = false;
      // Convert Set to array to iterate without infinite loop as Set grows
      const currentIncluded = Array.from(includedNames);

      for (const name of currentIncluded) {
        const step = stepMap.get(name);
        if (step && step.dependencies) {
          for (const dep of step.dependencies) {
            // Respect exclusion rules even when gathering dependencies
            const depStep = stepMap.get(dep);
            if (!depStep) continue;

            const isExcludedByName = excludeNames && excludeNames.includes(dep);
            const isExcludedByTag = excludeTags && depStep.tags?.some((t) => excludeTags.includes(t));

            if (!includedNames.has(dep) && !isExcludedByName && !isExcludedByTag) {
              includedNames.add(dep);
              changed = true;
            }
          }
        }
      }
    }

    // Rebuild the final array maintaining the original order
    filteredSteps = steps.filter((step) => includedNames.has(step.name));
  }

  return filteredSteps;
}
