import { ICacheProvider } from "../contracts/ICacheProvider.js";
import { TaskResult } from "../TaskResult.js";

interface CacheEntry {
  result: TaskResult;
  expiresAt?: number;
}

/**
 * A simple in-memory implementation of ICacheProvider.
 */
export class MemoryCacheProvider implements ICacheProvider {
  private readonly cache = new Map<string, CacheEntry>();

  get(key: string): TaskResult | undefined {
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

  set(key: string, result: TaskResult, ttl?: number): void {
    const entry: CacheEntry = {
      result,
    };

    if (ttl !== undefined) {
      entry.expiresAt = Date.now() + ttl;
    }

    this.cache.set(key, entry);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}
