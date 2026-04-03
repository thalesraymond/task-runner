import { ICacheProvider } from "../contracts/ICacheProvider.js";
import { TaskResult } from "../TaskResult.js";

/**
 * An in-memory implementation of ICacheProvider.
 */
export class MemoryCacheProvider implements ICacheProvider {
  private readonly cache = new Map<string, { value: TaskResult; expiresAt?: number }>();

  async get(key: string): Promise<TaskResult | undefined> {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt !== undefined && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  async set(key: string, result: TaskResult, ttl?: number): Promise<void> {
    const expiresAt = ttl !== undefined ? Date.now() + ttl : undefined;
    this.cache.set(key, { value: result, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }
}
