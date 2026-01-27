/**
 * AMS Cache Module
 * Manages in-memory cache + localStorage persistence with TTL and request deduplication
 */

// Cache entry with metadata
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Serializable cache entry for localStorage
interface StoredCacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Default TTLs
export const CACHE_TTL = {
  REFERENTIALS: 86400000, // 24 hours for gen* referentials
  DEFAULT: 300000,        // 5 minutes for regular data
  SHORT: 60000,           // 1 minute for frequently changing data
  NONE: 0,                // No cache
} as const;

// In-memory cache
const memoryCache = new Map<string, CacheEntry<unknown>>();

// In-flight request promises for deduplication
const inFlightRequests = new Map<string, Promise<unknown>>();

// localStorage key prefix
const STORAGE_PREFIX = 'ams_cache_';

/**
 * Generate a cache key from endpoint and params
 */
export function makeCacheKey(endpoint: string, params?: Record<string, string | number | boolean>): string {
  if (!params || Object.keys(params).length === 0) {
    return endpoint;
  }
  const sortedParams = Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&');
  return `${endpoint}?${sortedParams}`;
}

/**
 * Check if a cache entry is still valid
 */
function isValid<T>(entry: CacheEntry<T> | null): entry is CacheEntry<T> {
  if (!entry) return false;
  if (entry.ttl === 0) return false;
  return Date.now() - entry.timestamp < entry.ttl;
}

/**
 * Get from memory cache
 */
export function getFromMemory<T>(key: string): T | null {
  const entry = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (entry && isValid(entry)) {
    return entry.data;
  }
  // Clean up expired entry
  if (entry) {
    memoryCache.delete(key);
  }
  return null;
}

/**
 * Set in memory cache
 */
export function setInMemory<T>(key: string, data: T, ttl: number = CACHE_TTL.DEFAULT): void {
  memoryCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

/**
 * Get from localStorage cache
 */
export function getFromStorage<T>(key: string): T | null {
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + key);
    if (!stored) return null;
    
    const entry: StoredCacheEntry<T> = JSON.parse(stored);
    if (entry.ttl > 0 && Date.now() - entry.timestamp < entry.ttl) {
      return entry.data;
    }
    // Clean up expired entry
    localStorage.removeItem(STORAGE_PREFIX + key);
    return null;
  } catch (error) {
    console.warn('[AMS Cache] Failed to read from localStorage:', key, error);
    return null;
  }
}

/**
 * Set in localStorage cache
 */
export function setInStorage<T>(key: string, data: T, ttl: number = CACHE_TTL.DEFAULT): void {
  try {
    const entry: StoredCacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
  } catch (error) {
    console.warn('[AMS Cache] Failed to write to localStorage:', key, error);
  }
}

/**
 * Get from cache (memory first, then localStorage)
 */
export function get<T>(key: string): T | null {
  // Try memory first (fastest)
  const memResult = getFromMemory<T>(key);
  if (memResult !== null) {
    return memResult;
  }
  
  // Try localStorage
  const storageResult = getFromStorage<T>(key);
  if (storageResult !== null) {
    // Promote to memory cache for faster subsequent access
    setInMemory(key, storageResult, CACHE_TTL.DEFAULT);
    return storageResult;
  }
  
  return null;
}

/**
 * Set in both memory and localStorage cache
 */
export function set<T>(key: string, data: T, ttl: number = CACHE_TTL.DEFAULT, persistToStorage: boolean = true): void {
  setInMemory(key, data, ttl);
  if (persistToStorage && ttl > 0) {
    setInStorage(key, data, ttl);
  }
}

/**
 * Invalidate a specific cache key
 */
export function invalidate(key: string): void {
  memoryCache.delete(key);
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Invalidate all cache entries matching a prefix
 */
export function invalidatePrefix(prefix: string): void {
  // Memory cache
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
  
  // localStorage
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX + prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Clear all AMS cache
 */
export function clearAll(): void {
  memoryCache.clear();
  
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Check if a request is currently in-flight
 */
export function getInFlight<T>(key: string): Promise<T> | null {
  return (inFlightRequests.get(key) as Promise<T>) || null;
}

/**
 * Register an in-flight request
 */
export function setInFlight<T>(key: string, promise: Promise<T>): void {
  inFlightRequests.set(key, promise);
  
  // Clean up when resolved or rejected
  promise.finally(() => {
    inFlightRequests.delete(key);
  });
}

/**
 * Deduplicated fetch wrapper
 * If the same request is already in-flight, returns the existing promise
 */
export async function deduplicatedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL.DEFAULT,
  persistToStorage: boolean = true
): Promise<T> {
  // Check cache first
  const cached = get<T>(key);
  if (cached !== null) {
    return cached;
  }
  
  // Check if request is already in-flight
  const inFlight = getInFlight<T>(key);
  if (inFlight) {
    return inFlight;
  }
  
  // Make the request and register it
  const promise = fetcher().then(data => {
    set(key, data, ttl, persistToStorage);
    return data;
  });
  
  setInFlight(key, promise);
  return promise;
}

// Export cache stats for debugging
export function getCacheStats(): { memorySize: number; inFlightCount: number } {
  return {
    memorySize: memoryCache.size,
    inFlightCount: inFlightRequests.size,
  };
}
