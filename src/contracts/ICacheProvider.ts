import { TaskResult } from "../TaskResult.js";

/**
 * Interface for a cache provider used to store and retrieve task execution results.
 */
export interface ICacheProvider {
  /**
   * Retrieves a cached result by its key.
   * @param key The unique cache key.
   * @returns A promise resolving to the cached TaskResult, or undefined if not found or expired.
   */
  get(key: string): Promise<TaskResult | undefined>;

  /**
   * Stores a task result in the cache.
   * @param key The unique cache key.
   * @param result The task result to store.
   * @param ttl Optional time-to-live in milliseconds. If omitted, the cache may be indefinite.
   * @returns A promise that resolves when the store operation completes.
   */
  set(key: string, result: TaskResult, ttl?: number): Promise<void>;

  /**
   * Deletes a cached result by its key.
   * @param key The unique cache key.
   * @returns A promise that resolves when the delete operation completes.
   */
  delete(key: string): Promise<void>;
}
