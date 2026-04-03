import { TaskStep } from "../TaskStep.js";
import { TaskFilterConfig } from "../contracts/TaskFilterConfig.js";

/**
 * Filters an array of TaskSteps based on a TaskFilterConfig.
 * @param steps The steps to filter.
 * @param config The filtering configuration.
 * @returns A new array of filtered TaskSteps.
 */
export function filterTasks<T>(
  steps: TaskStep<T>[],
  config: TaskFilterConfig
): TaskStep<T>[] {
  const {
    includeTags = [],
    excludeTags = [],
    includeNames = [],
    excludeNames = [],
    includeDependencies = false,
  } = config;

  const hasInclusions = includeTags.length > 0 || includeNames.length > 0;

  // 1. Initial Filtering
  const selectedTasks = new Set<string>();

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]!;

    // Evaluate exclusions first
    const isExcludedByName = excludeNames.includes(step.name);
    const isExcludedByTag = step.tags?.some(tag => excludeTags.includes(tag)) ?? false;

    if (isExcludedByName || isExcludedByTag) {
      continue;
    }

    if (!hasInclusions) {
      selectedTasks.add(step.name);
      continue;
    }

    // Evaluate inclusions
    const isIncludedByName = includeNames.includes(step.name);
    const isIncludedByTag = step.tags?.some(tag => includeTags.includes(tag)) ?? false;

    if (isIncludedByName || isIncludedByTag) {
      selectedTasks.add(step.name);
    }
  }

  // 2. Resolve Dependencies
  if (includeDependencies) {
    const stepMap = new Map<string, TaskStep<T>>();
    for (let i = 0; i < steps.length; i++) {
      stepMap.set(steps[i]!.name, steps[i]!);
    }

    const queue = Array.from(selectedTasks);
    let head = 0;

    while (head < queue.length) {
      const currentName = queue[head]!;
      head++;

      const step = stepMap.get(currentName);
      if (!step) continue;
      if (step.dependencies) {
        for (let i = 0; i < step.dependencies.length; i++) {
          const depName = step.dependencies[i]!;
          if (!selectedTasks.has(depName)) {
            selectedTasks.add(depName);
            queue.push(depName);
          }
        }
      }
    }
  }

  // 3. Return Filtered Array
  const result: TaskStep<T>[] = [];
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]!;
    if (selectedTasks.has(step.name)) {
      result.push(step);
    }
  }

  return result;
}
