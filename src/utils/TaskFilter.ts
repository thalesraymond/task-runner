import { TaskStep } from "../TaskStep.js";
import { TaskFilterConfig } from "../contracts/TaskFilterConfig.js";

/**
 * Filters an array of TaskStep objects based on the provided configuration.
 *
 * @param steps The original list of tasks.
 * @param config The filter configuration.
 * @returns A new array of filtered tasks.
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
    includeDependencies = true,
  } = config;

  // Helper sets for quick lookup
  const inclTagsSet = includeTags ? new Set(includeTags) : null;
  const exclTagsSet = excludeTags ? new Set(excludeTags) : null;
  const inclNamesSet = includeNames ? new Set(includeNames) : null;
  const exclNamesSet = excludeNames ? new Set(excludeNames) : null;

  // Map of task names to task objects for quick dependency lookup
  const taskMap = new Map<string, TaskStep<TContext>>();
  for (let i = 0; i < steps.length; i++) {
    taskMap.set(steps[i].name, steps[i]);
  }

  // 1. Determine initially included tasks
  const includedTasks = new Set<string>();

  for (let i = 0; i < steps.length; i++) {
    const task = steps[i];
    let isIncluded = false;

    // If no inclusion criteria provided, include all initially
    if (!inclTagsSet && !inclNamesSet) {
      isIncluded = true;
    } else {
      // Check if it matches includeNames
      if (inclNamesSet && inclNamesSet.has(task.name)) {
        isIncluded = true;
      }
      // Check if it matches includeTags
      if (!isIncluded && inclTagsSet && task.tags) {
        for (let j = 0; j < task.tags.length; j++) {
          if (inclTagsSet.has(task.tags[j])) {
            isIncluded = true;
            break;
          }
        }
      }
    }

    if (isIncluded) {
      includedTasks.add(task.name);
    }
  }

  // 2. Remove explicitly excluded tasks
  const excludedTasks = new Set<string>();
  for (let i = 0; i < steps.length; i++) {
    const task = steps[i];
    let isExcluded = false;

    if (exclNamesSet && exclNamesSet.has(task.name)) {
      isExcluded = true;
    }

    if (!isExcluded && exclTagsSet && task.tags) {
      for (let j = 0; j < task.tags.length; j++) {
        if (exclTagsSet.has(task.tags[j])) {
          isExcluded = true;
          break;
        }
      }
    }

    if (isExcluded) {
      excludedTasks.add(task.name);
      includedTasks.delete(task.name);
    }
  }

  // 3. Resolve dependencies if needed
  if (includeDependencies) {
    const queue = Array.from(includedTasks);
    let queueIdx = 0;

    while (queueIdx < queue.length) {
      const taskName = queue[queueIdx++];
      const task = taskMap.get(taskName);

      if (task && task.dependencies) {
        for (let i = 0; i < task.dependencies.length; i++) {
          const depName = task.dependencies[i];

          // If the dependency isn't already included and isn't explicitly excluded
          if (!includedTasks.has(depName) && !excludedTasks.has(depName)) {
            includedTasks.add(depName);
            queue.push(depName);
          }
        }
      }
    }
  }

  // 4. Return the filtered tasks in the original order
  const filteredSteps: TaskStep<TContext>[] = [];
  for (let i = 0; i < steps.length; i++) {
    if (includedTasks.has(steps[i].name)) {
      filteredSteps.push(steps[i]);
    }
  }

  return filteredSteps;
}
