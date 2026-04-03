import { TaskResult } from "../TaskResult.js";

/**
 * Interface for task output cache providers.
 */
export interface ICacheProvider {
  /**
   * Retrieves a cached result by its key.
   * @param key The unique cache key.
   * @returns A promise resolving to the cached TaskResult, or undefined if not found.
   */
  get(key: string): Promise<TaskResult | undefined>;

  /**
   * Stores a task result in the cache.
   * @param key The unique cache key.
   * @param value The task result to cache.
   * @param ttl Optional time-to-live in milliseconds.
   * @returns A promise that resolves when the cache is updated.
   */
  set(key: string, value: TaskResult, ttl?: number): Promise<void>;

  /**
   * Deletes a cached result by its key.
   * @param key The unique cache key.
   * @returns A promise that resolves when the key is deleted.
   */
  delete(key: string): Promise<void>;
}
