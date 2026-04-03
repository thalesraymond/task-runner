import { TaskResult } from "../TaskResult.js";

/**
 * Interface for cache providers used by the CachingExecutionStrategy.
 */
export interface ICacheProvider {
  /**
   * Retrieves a cached task result.
   * @param key The cache key.
   * @returns A promise resolving to the task result if found, or undefined if not found.
   */
  get(key: string): Promise<TaskResult | undefined> | TaskResult | undefined;

  /**
   * Stores a task result in the cache.
   * @param key The cache key.
   * @param result The task result to store.
   * @param ttl Optional time-to-live in milliseconds.
   * @returns A promise that resolves when the store operation completes.
   */
  set(key: string, result: TaskResult, ttl?: number): Promise<void> | void;

  /**
   * Deletes a cached task result.
   * @param key The cache key.
   * @returns A promise that resolves when the delete operation completes.
   */
  delete(key: string): Promise<void> | void;
}
