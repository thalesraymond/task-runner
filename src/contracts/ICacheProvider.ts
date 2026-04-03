import { TaskResult } from "../TaskResult.js";

/**
 * Interface for caching task results.
 */
export interface ICacheProvider {
  /**
   * Retrieves a cached result by key.
   * @param key The unique cache key.
   * @returns A promise resolving to the cached result, or undefined if not found or expired.
   */
  get(key: string): Promise<TaskResult | undefined>;

  /**
   * Stores a result in the cache.
   * @param key The unique cache key.
   * @param value The task result to cache.
   * @param ttl Optional time-to-live in milliseconds.
   */
  set(key: string, value: TaskResult, ttl?: number): Promise<void>;

  /**
   * Deletes a cached result by key.
   * @param key The unique cache key.
   */
  delete(key: string): Promise<void>;
}
