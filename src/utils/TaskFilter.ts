import { TaskStep } from "../TaskStep.js";
import { TaskFilterConfig } from "../contracts/TaskFilterConfig.js";

/**
 * Filters a list of task steps based on a provided configuration.
 * @param steps The array of tasks to filter.
 * @param config The filtering configuration.
 * @returns A new array containing the matching subset of tasks.
 */
export function filterTasks<TContext>(
  steps: TaskStep<TContext>[],
  config: TaskFilterConfig
): TaskStep<TContext>[] {
  const stepsMap = new Map(steps.map((step) => [step.name, step]));

  // Helper to check if a task matches inclusion criteria
  const isIncluded = (step: TaskStep<TContext>): boolean => {
    // If no inclusion criteria provided, include by default unless excluded
    if (!config.includeNames && !config.includeTags) {
      return true;
    }

    if (config.includeNames && config.includeNames.includes(step.name)) {
      return true;
    }

    if (config.includeTags && step.tags) {
      for (let i = 0; i < config.includeTags.length; i++) {
        if (step.tags.includes(config.includeTags[i]!)) {
          return true;
        }
      }
    }

    return false;
  };

  // Helper to check if a task matches exclusion criteria
  const isExcluded = (step: TaskStep<TContext>): boolean => {
    if (config.excludeNames && config.excludeNames.includes(step.name)) {
      return true;
    }

    if (config.excludeTags && step.tags) {
      for (let i = 0; i < config.excludeTags.length; i++) {
        if (step.tags.includes(config.excludeTags[i]!)) {
          return true;
        }
      }
    }

    return false;
  };

  // 1. Initial filtering based on includes and excludes
  const matchedSteps: TaskStep<TContext>[] = [];
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]!;
    if (!isExcluded(step) && isIncluded(step)) {
      matchedSteps.push(step);
    }
  }

  // 2. Resolve dependencies if required
  if (config.includeDependencies) {
    const includedNames = new Set(matchedSteps.map((s) => s.name));
    const toProcess = [...matchedSteps];

    while (toProcess.length > 0) {
      const current = toProcess.pop()!;
      if (current.dependencies) {
        for (let i = 0; i < current.dependencies.length; i++) {
          const depName = current.dependencies[i]!;
          if (!includedNames.has(depName)) {
            const depStep = stepsMap.get(depName);
            if (depStep) {
              includedNames.add(depName);
              matchedSteps.push(depStep);
              toProcess.push(depStep);
            }
          }
        }
      }
    }
  }

  // Sort matchedSteps by their original order in `steps` to preserve stability
  const originalIndices = new Map(steps.map((step, idx) => [step.name, idx]));
  matchedSteps.sort((a, b) => {
    const indexA = originalIndices.get(a.name);
    const indexB = originalIndices.get(b.name);
    return (indexA !== undefined ? indexA : /* istanbul ignore next */ 0) - (indexB !== undefined ? indexB : /* istanbul ignore next */ 0);
  });

  return matchedSteps;
}
