import { TaskResult } from "../TaskResult.js";

/**
 * Interface for cache providers used by the CachingExecutionStrategy.
 */
export interface ICacheProvider {
  /**
   * Retrieves a cached result by its key.
   * @param key The cache key.
   * @returns The cached TaskResult or undefined if not found.
   */
  get(key: string): Promise<TaskResult | undefined> | TaskResult | undefined;

  /**
   * Stores a result in the cache.
   * @param key The cache key.
   * @param result The task result to cache.
   * @param ttl Optional time-to-live in milliseconds.
   */
  set(key: string, result: TaskResult, ttl?: number): Promise<void> | void;

  /**
   * Deletes a cached result by its key.
   * @param key The cache key.
   */
  delete(key: string): Promise<void> | void;
}
