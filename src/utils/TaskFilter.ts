import { TaskStep } from "../TaskStep.js";
import { TaskFilterConfig } from "../contracts/TaskFilterConfig.js";

/**
 * Filters a list of tasks based on the provided configuration.
 *
 * @param steps The original array of tasks.
 * @param config The filtering configuration.
 * @returns A new array containing the filtered tasks.
 */
export function filterTasks<TContext>(
  steps: TaskStep<TContext>[],
  config: TaskFilterConfig
): TaskStep<TContext>[] {
  const stepMap = new Map(steps.map((step) => [step.name, step]));

  const filteredSteps = steps.filter((step) => {
    // 1. Check exclusions first (highest priority)
    if (
      config.excludeNames?.includes(step.name) ||
      (step.tags && config.excludeTags?.some((tag) => step.tags!.includes(tag)))
    ) {
      return false;
    }

    // 2. Check inclusions (if both are provided, satisfying either is enough or requires both? Usually OR semantics for inclusions)
    // Actually, usually if include is present, it MUST match one of the inclusions.
    // Let's implement OR logic: if included by name OR included by tag.
    const hasIncludeNames =
      config.includeNames && config.includeNames.length > 0;
    const hasIncludeTags = config.includeTags && config.includeTags.length > 0;

    if (!hasIncludeNames && !hasIncludeTags) {
      return true; // No inclusion filters, so keep it if it passed exclusion
    }

    const includedByName = hasIncludeNames && config.includeNames!.includes(step.name);
    const includedByTag =
      hasIncludeTags &&
      step.tags &&
      config.includeTags!.some((tag) => step.tags!.includes(tag));

    return includedByName || includedByTag;
  });

  if (!config.includeDependencies) {
    return filteredSteps;
  }

  // Include dependencies recursively
  const resultSet = new Set<string>(filteredSteps.map((s) => s.name));
  const queue = [...filteredSteps];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.dependencies) {
      for (const depName of current.dependencies) {
        if (!resultSet.has(depName)) {
          resultSet.add(depName);
          const depStep = stepMap.get(depName);
          if (depStep) {
            queue.push(depStep);
          }
        }
      }
    }
  }

  // Preserve original order and map names back to steps
  return steps.filter((step) => resultSet.has(step.name));
}
