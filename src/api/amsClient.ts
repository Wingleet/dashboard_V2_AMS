/**
 * AMS HTTP Client
 * Typed fetch wrapper with timeout, retry, error handling, and auth management
 */

import { getStoredToken, clearToken, getApiSettings } from '../utils/api';

// API Error type for normalized error handling
export interface AmsApiError {
  type: 'network' | 'timeout' | 'http' | 'parse' | 'unknown';
  status?: number;
  statusText?: string;
  message: string;
  endpoint: string;
  params?: Record<string, string>;
}

// Response wrapper
export type AmsResult<T> = 
  | { ok: true; data: T }
  | { ok: false; error: AmsApiError };

// Client configuration
export interface AmsClientConfig {
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  onUnauthorized?: () => void;
}

// Default configuration
const defaultConfig: AmsClientConfig = {
  baseUrl: '/api',
  timeout: 30000,
  maxRetries: 2,
  retryDelay: 1000,
  onUnauthorized: () => {
    clearToken();
    window.location.reload();
  },
};

// Current configuration (mutable for runtime changes)
let config: AmsClientConfig = { ...defaultConfig };

/**
 * Configure the AMS client
 */
export function configureClient(newConfig: Partial<AmsClientConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Get current client configuration
 */
export function getClientConfig(): Readonly<AmsClientConfig> {
  return config;
}

/**
 * Build full URL from path and query params
 */
export function buildUrl(path: string, params?: Record<string, string | number | boolean>): string {
  const settings = getApiSettings();
  const apiVer = settings?.apiVer || 'v1';
  
  // Ensure path starts with version prefix if not already
  let fullPath = path;
  if (!path.startsWith('/v') && !path.startsWith('v')) {
    fullPath = `/${apiVer}${path.startsWith('/') ? path : '/' + path}`;
  }
  
  const url = new URL(fullPath, window.location.origin + config.baseUrl);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });
  }
  
  return url.pathname + url.search;
}

/**
 * Get authorization headers
 */
function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  const settings = getApiSettings();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (settings?.version) {
    headers['version'] = settings.version;
  }
  
  if (settings?.serverdb) {
    headers['serverdb'] = settings.serverdb;
  }
  
  return headers;
}

/**
 * Parse response body safely
 */
async function parseResponse<T>(response: Response, endpoint: string): Promise<AmsResult<T>> {
  const contentType = response.headers.get('content-type') || '';
  
  try {
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return { ok: true, data: data as T };
    }
    
    // Handle text responses
    const text = await response.text();
    
    // Try to parse as JSON anyway (some APIs don't set correct content-type)
    try {
      const data = JSON.parse(text);
      return { ok: true, data: data as T };
    } catch {
      // Return raw text wrapped
      return { ok: true, data: text as unknown as T };
    }
  } catch (error) {
    return {
      ok: false,
      error: {
        type: 'parse',
        message: `Failed to parse response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        endpoint,
      },
    };
  }
}

/**
 * Create API error from various error conditions
 */
function createError(
  type: AmsApiError['type'],
  message: string,
  endpoint: string,
  params?: Record<string, string>,
  status?: number,
  statusText?: string
): AmsApiError {
  return { type, message, endpoint, params, status, statusText };
}

/**
 * Sleep helper for retry delay
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main fetch function with retry logic
 */
async function fetchWithRetry<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  params?: Record<string, string>,
  body?: unknown,
  attempt: number = 0
): Promise<AmsResult<T>> {
  const url = config.baseUrl + endpoint;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);
  
  try {
    if (import.meta.env.DEV) {
      console.log(`[AMS Client] ${method} ${url}`, params || '');
    }
    
    const response = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // Handle 401 Unauthorized
    if (response.status === 401) {
      if (import.meta.env.DEV) {
        console.warn('[AMS Client] Unauthorized - triggering logout');
      }
      config.onUnauthorized?.();
      return {
        ok: false,
        error: createError('http', 'Unauthorized - session expired', endpoint, params, 401, 'Unauthorized'),
      };
    }
    
    // Handle other HTTP errors
    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      
      // Retry on 5xx errors
      if (response.status >= 500 && attempt < config.maxRetries) {
        if (import.meta.env.DEV) {
          console.warn(`[AMS Client] Server error ${response.status}, retrying... (${attempt + 1}/${config.maxRetries})`);
        }
        await sleep(config.retryDelay * (attempt + 1));
        return fetchWithRetry(method, endpoint, params, body, attempt + 1);
      }
      
      return {
        ok: false,
        error: createError(
          'http',
          `HTTP ${response.status}: ${errorText}`,
          endpoint,
          params,
          response.status,
          response.statusText
        ),
      };
    }
    
    // Parse successful response
    return parseResponse<T>(response, endpoint);
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Handle abort (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      // Retry on timeout
      if (attempt < config.maxRetries) {
        if (import.meta.env.DEV) {
          console.warn(`[AMS Client] Timeout, retrying... (${attempt + 1}/${config.maxRetries})`);
        }
        await sleep(config.retryDelay);
        return fetchWithRetry(method, endpoint, params, body, attempt + 1);
      }
      
      return {
        ok: false,
        error: createError('timeout', `Request timed out after ${config.timeout}ms`, endpoint, params),
      };
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (attempt < config.maxRetries) {
        if (import.meta.env.DEV) {
          console.warn(`[AMS Client] Network error, retrying... (${attempt + 1}/${config.maxRetries})`);
        }
        await sleep(config.retryDelay * (attempt + 1));
        return fetchWithRetry(method, endpoint, params, body, attempt + 1);
      }
      
      return {
        ok: false,
        error: createError('network', 'Network error - check your connection', endpoint, params),
      };
    }
    
    // Unknown error
    return {
      ok: false,
      error: createError(
        'unknown',
        error instanceof Error ? error.message : 'Unknown error occurred',
        endpoint,
        params
      ),
    };
  }
}

/**
 * GET request
 */
export async function get<T>(endpoint: string, params?: Record<string, string>): Promise<AmsResult<T>> {
  const url = params ? buildUrl(endpoint, params).replace(config.baseUrl, '') : endpoint;
  return fetchWithRetry<T>('GET', url, params);
}

/**
 * POST request
 */
export async function post<T>(endpoint: string, body?: unknown, params?: Record<string, string>): Promise<AmsResult<T>> {
  const url = params ? buildUrl(endpoint, params).replace(config.baseUrl, '') : endpoint;
  return fetchWithRetry<T>('POST', url, params, body);
}

/**
 * PUT request
 */
export async function put<T>(endpoint: string, body?: unknown, params?: Record<string, string>): Promise<AmsResult<T>> {
  const url = params ? buildUrl(endpoint, params).replace(config.baseUrl, '') : endpoint;
  return fetchWithRetry<T>('PUT', url, params, body);
}

/**
 * DELETE request
 */
export async function del<T>(endpoint: string, params?: Record<string, string>): Promise<AmsResult<T>> {
  const url = params ? buildUrl(endpoint, params).replace(config.baseUrl, '') : endpoint;
  return fetchWithRetry<T>('DELETE', url, params);
}

/**
 * Unwrap result or throw - useful for non-error-boundary code
 */
export function unwrap<T>(result: AmsResult<T>): T {
  if (result.ok) {
    return result.data;
  }
  throw new Error(`[${result.error.type}] ${result.error.message} (${result.error.endpoint})`);
}

/**
 * Check if result is an error
 */
export function isError<T>(result: AmsResult<T>): result is { ok: false; error: AmsApiError } {
  return !result.ok;
}

// Export client instance for direct use
export const amsClient = {
  get,
  post,
  put,
  del,
  unwrap,
  isError,
  configure: configureClient,
  getConfig: getClientConfig,
  buildUrl,
};

export default amsClient;
