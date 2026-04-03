import { TaskStep } from "../TaskStep.js";
import { TaskFilterConfig } from "../contracts/TaskFilterConfig.js";

/**
 * Filters a list of tasks based on the provided configuration.
 * Exclusions take precedence over inclusions.
 * If includeDependencies is true, it will recursively include all tasks required by the included tasks.
 *
 * @param steps The list of all available tasks.
 * @param config The filtering configuration.
 * @returns A filtered array of tasks.
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

  const stepMap = new Map<string, TaskStep<TContext>>();
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    stepMap.set(step.name, step);
  }

  const matchesFilter = (step: TaskStep<TContext>): boolean => {
    // Exclusions
    if (excludeNames?.includes(step.name)) {
      return false;
    }
    if (excludeTags?.length && step.tags?.length) {
      for (let i = 0; i < excludeTags.length; i++) {
        if (step.tags.includes(excludeTags[i])) {
          return false;
        }
      }
    }

    // Inclusions
    const hasIncludeRules = (includeNames && includeNames.length > 0) || (includeTags && includeTags.length > 0);

    if (!hasIncludeRules) {
      return true; // Include all if no specific inclusions are provided (and it wasn't excluded)
    }

    if (includeNames?.includes(step.name)) {
      return true;
    }

    if (includeTags?.length && step.tags?.length) {
      for (let i = 0; i < includeTags.length; i++) {
        if (step.tags.includes(includeTags[i])) {
          return true;
        }
      }
    }

    return false; // Did not match any inclusion rules
  };

  const directlyIncluded = new Set<string>();
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (matchesFilter(step)) {
      directlyIncluded.add(step.name);
    }
  }

  const finalIncluded = new Set<string>(directlyIncluded);

  if (includeDependencies) {
    const processQueue = Array.from(directlyIncluded);

    while (processQueue.length > 0) {
      const currentName = processQueue.shift()!;
      const currentStep = stepMap.get(currentName);

      if (currentStep && currentStep.dependencies) {
        for (let i = 0; i < currentStep.dependencies.length; i++) {
          const depName = currentStep.dependencies[i];
          if (!finalIncluded.has(depName)) {
            finalIncluded.add(depName);
            processQueue.push(depName);
          }
        }
      }
    }
  }
  // NOSONAR

  const result: TaskStep<TContext>[] = [];
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (finalIncluded.has(step.name)) {
      result.push(step);
    }
  }

  return result;
}
