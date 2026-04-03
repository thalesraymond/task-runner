import { TaskStep } from "../TaskStep.js";
import { TaskFilterConfig } from "../contracts/TaskFilterConfig.js";

/**
 * Filters an array of tasks based on the provided configuration.
 *
 * @param steps The array of tasks to filter.
 * @param config The filter configuration.
 * @returns A new array of tasks that match the filter criteria.
 */
export function filterTasks<TContext>(
  steps: TaskStep<TContext>[],
  config: TaskFilterConfig
): TaskStep<TContext>[] {
  const stepMap = new Map<string, TaskStep<TContext>>();
  for (const step of steps) {
    stepMap.set(step.name, step);
  }

  const initialMatches = new Set<string>();

  for (const step of steps) {
    let included = true;

    // Check inclusion criteria
    if (!config.includeNames?.length && !config.includeTags?.length) {
      included = true;
    } else if (config.includeNames?.length && config.includeTags?.length) {
      // If both are provided, we should match either.
      const nameMatch = config.includeNames.includes(step.name);
      const tagMatch = !!step.tags && step.tags.some(tag => config.includeTags!.includes(tag));

      included = nameMatch || tagMatch;
    } else if (config.includeNames?.length) {
      included = config.includeNames.includes(step.name);
    } else {
      // Only includeTags is provided
      included = !!step.tags && step.tags.some(tag => config.includeTags!.includes(tag));
    }

    // Check exclusion criteria
    if (config.excludeNames && config.excludeNames.includes(step.name)) {
      included = false;
    }

    if (config.excludeTags && !!step.tags && step.tags.some(tag => config.excludeTags!.includes(tag))) {
      included = false;
    }

    if (included) {
      initialMatches.add(step.name);
    }
  }

  // Handle dependencies
  if (config.includeDependencies) {
    const queue = Array.from(initialMatches);
    const visited = new Set<string>(initialMatches);

    while (queue.length > 0) {
      const currentName = queue.shift()!;
      const currentStep = stepMap.get(currentName);

      if (currentStep && currentStep.dependencies) {
        for (const dep of currentStep.dependencies) {
          // If a dependency is excluded, we might not include it, but
          // standard behavior is usually to override exclusion for explicit dependencies,
          // or fail. Let's include it unless it's explicitly excluded.
          // Wait, if it's explicitly excluded, it might fail the pipeline.
          // For now, if we include dependencies, we'll just add them unless they are in exclusions.
          let depExcluded = false;
          const depStep = stepMap.get(dep);

          if (config.excludeNames && config.excludeNames.includes(dep)) {
            depExcluded = true;
          }
          if (depStep && config.excludeTags && depStep.tags && depStep.tags.some(tag => config.excludeTags!.includes(tag))) {
            depExcluded = true;
          }

          if (!visited.has(dep) && !depExcluded) {
            visited.add(dep);
            queue.push(dep);
            initialMatches.add(dep);
          }
        }
      }
    }
  }

  // Filter the final list, preserving original order
  return steps.filter(step => initialMatches.has(step.name));
}
