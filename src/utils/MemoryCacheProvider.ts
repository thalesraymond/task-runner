import { ICacheProvider } from "../contracts/ICacheProvider.js";
import { TaskResult } from "../TaskResult.js";

interface CacheEntry {
  result: TaskResult;
  expiresAt?: number;
}

/**
 * A default, in-memory implementation of ICacheProvider.
 */
export class MemoryCacheProvider implements ICacheProvider {
  private readonly cache = new Map<string, CacheEntry>();

  /**
   * Retrieves a cached result if it exists and has not expired.
   */
  public async get(key: string): Promise<TaskResult | undefined> {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    // Return a clone of the cached result
    return { ...entry.result };
  }

  /**
   * Stores a result in the cache with an optional TTL.
   */
  public async set(key: string, result: TaskResult, ttl?: number): Promise<void> {
    const entry: CacheEntry = {
      // Store a clone of the result
      result: { ...result }
    };

    if (ttl !== undefined && ttl > 0) {
      entry.expiresAt = Date.now() + ttl;
    }

    this.cache.set(key, entry);
  }

  /**
   * Removes a result from the cache.
   */
  public async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }
}
