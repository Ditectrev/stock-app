/**
 * Caching service using in-memory cache with TTL-based expiration
 * For production, this should be replaced with Vercel KV or Redis
 */

import { logger } from "./logger";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class CacheService {
  private cache: Map<string, CacheEntry<unknown>>;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Generate cache key from symbol and data type
   */
  generateKey(symbol: string, dataType: string): string {
    return `${symbol.toUpperCase()}:${dataType}`;
  }

  /**
   * Set data in cache with TTL
   */
  set<T>(key: string, data: T, ttlSeconds: number): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data, expiresAt });
    logger.debug("Cache set", { key, ttlSeconds });
  }

  /**
   * Get data from cache if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      logger.debug("Cache miss", { key });
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      logger.debug("Cache expired", { key });
      return null;
    }

    logger.debug("Cache hit", { key });
    return entry.data as T;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Invalidate cache for a specific key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    logger.info("Cache invalidated", { key });
  }

  /**
   * Invalidate all cache entries for a symbol
   */
  invalidateSymbol(symbol: string): void {
    const prefix = symbol.toUpperCase();
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
    logger.info("Symbol cache invalidated", {
      symbol,
      count: keysToDelete.length,
    });
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.info("Cache cleared", { entriesRemoved: size });
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const cacheService = new CacheService();
