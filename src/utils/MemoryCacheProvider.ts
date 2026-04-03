import { TaskResult } from "../TaskResult.js";
import { ICacheProvider } from "../contracts/ICacheProvider.js";

/**
 * A default, in-memory implementation of ICacheProvider.
 */
export class MemoryCacheProvider implements ICacheProvider {
  private readonly cache = new Map<
    string,
    { result: TaskResult; expiresAt?: number }
  >();

  /**
   * Retrieves a cached result by key.
   * @param key The unique cache key.
   * @returns A promise resolving to the cached result, or undefined if not found or expired.
   */
  public async get(key: string): Promise<TaskResult | undefined> {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt !== undefined && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.result;
  }

  /**
   * Stores a result in the cache.
   * @param key The unique cache key.
   * @param value The task result to cache.
   * @param ttl Optional time-to-live in milliseconds.
   */
  public async set(
    key: string,
    value: TaskResult,
    ttl?: number
  ): Promise<void> {
    const expiresAt = ttl !== undefined ? Date.now() + ttl : undefined;
    this.cache.set(key, { result: value, expiresAt });
  }

  /**
   * Deletes a cached result by key.
   * @param key The unique cache key.
   */
  public async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }
}
