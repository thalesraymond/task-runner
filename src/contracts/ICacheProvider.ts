import { TaskResult } from "../TaskResult.js";

/**
 * Interface for cache providers used by the TaskRunner.
 */
export interface ICacheProvider {
  /**
   * Retrieves a cached result by its key.
   * @param key The cache key.
   * @returns A promise resolving to the cached TaskResult, or undefined if not found.
   */
  get(key: string): Promise<TaskResult | undefined>;

  /**
   * Stores a task result in the cache.
   * @param key The cache key.
   * @param result The TaskResult to store.
   * @param ttl Optional time-to-live in milliseconds.
   * @returns A promise resolving when the set operation completes.
   */
  set(key: string, result: TaskResult, ttl?: number): Promise<void>;

  /**
   * Removes a cached result by its key.
   * @param key The cache key.
   * @returns A promise resolving when the delete operation completes.
   */
  delete(key: string): Promise<void>;
}
