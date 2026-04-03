import { ICacheProvider } from "../contracts/ICacheProvider.js";
import { TaskResult } from "../TaskResult.js";

interface CacheEntry {
  result: TaskResult;
  expiry?: number;
}

/**
 * An in-memory implementation of ICacheProvider.
 */
export class MemoryCacheProvider implements ICacheProvider {
  private cache = new Map<string, CacheEntry>();

  public get(key: string): TaskResult | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    if (entry.expiry !== undefined && Date.now() > entry.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.result;
  }

  public set(key: string, result: TaskResult, ttl?: number): void {
    const expiry = ttl !== undefined ? Date.now() + ttl : undefined;
    this.cache.set(key, { result, expiry });
  }

  public delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clears all entries from the cache.
   */
  public clear(): void {
    this.cache.clear();
  }
}
