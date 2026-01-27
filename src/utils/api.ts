// ERP API utilities for authentication and token management

export interface LoginParams {
  user: string;
  password: string;
  url: string;
  version: string;
  serverdb: string;
  serverdbpass: string;
}

export interface LoginResponse {
  token?: string;
  Token?: string;
  bearerToken?: string;
  [key: string]: any;
}

/**
 * Authenticate with ERP API and return the token
 */
export async function loginERP(params: LoginParams): Promise<string> {
  const { user, password, version, serverdb, serverdbpass } = params;
  
  const credentials = btoa(`${user}:${password}`);
  const authHeader = `Basic ${credentials}`;
  
  const headers: Record<string, string> = {
    'version': version,
    'serverdb': serverdb,
    'Authorization': authHeader,
  };
  
  if (serverdbpass && serverdbpass.trim()) {
    headers['serverdbpass'] = serverdbpass;
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);
  
  try {
    const response = await makeApiRequest('/Login', 'POST', headers, controller.signal);
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Authentication failed:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      if (response.status === 403) {
        throw new Error(`Access denied (403): Check database name '${serverdb}' and permissions. Server response: ${errorText}`);
      } else if (response.status === 401) {
        throw new Error(`Authentication failed (401): Check username/password. Server response: ${errorText}`);
      } else {
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}. Server response: ${errorText}`);
      }
    }
    
    let data: LoginResponse | string;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    let token: string;
    
    if (typeof data === 'string') {
      token = data.trim();
    } else {
      token = data.token || data.Token || data.bearerToken || '';
    }
    
    if (!token) {
      throw new Error('No token received from server');
    }
    
    return token;
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please check your connection and try again');
      }
      throw error;
    }
    
    throw new Error('Unknown error occurred during authentication');
  }
}

/**
 * Get authorization header from stored token
 */
export function authHeaderFromStorage(): { Authorization: string } | {} {
  const token = localStorage.getItem('erpToken');
  
  if (!token) {
    return {};
  }
  
  return {
    Authorization: `Bearer ${token}`
  };
}

/**
 * Save token to localStorage
 */
export function saveToken(token: string): void {
  localStorage.setItem('erpToken', token);
}

/**
 * Get token from localStorage
 */
export function getStoredToken(): string | null {
  return localStorage.getItem('erpToken');
}

/**
 * Clear stored token
 */
export function clearToken(): void {
  localStorage.removeItem('erpToken');
}

/**
 * Save API settings to localStorage
 */
export function saveApiSettings(settings: {
  user: string;
  url: string;
  version: string;
  serverdb: string;
  serverdbpass: string;
  apiVer: string;
}): void {
  localStorage.setItem('erpApiSettings', JSON.stringify(settings));
}

/**
 * Get API settings from localStorage
 */
export function getApiSettings(): {
  user: string;
  url: string;
  version: string;
  serverdb: string;
  serverdbpass: string;
  apiVer: string;
} | null {
  try {
    const settings = localStorage.getItem('erpApiSettings');
    if (settings) {
      return JSON.parse(settings);
    }
  } catch (error) {
    console.warn('Failed to parse API settings from localStorage:', error);
  }
  
  const amsBaseUrl = import.meta.env.VITE_AMS_BASE_URL || 'http://46.105.115.223:8181';
  const amsApiVer = import.meta.env.VITE_AMS_API_VER || 'v1';
  
  const url = amsBaseUrl.replace(/^https?:\/\//, '');
  
  return {
    user: 'ADMIN',
    url: url,
    version: amsApiVer,
    serverdb: 'APP_TEST',
    serverdbpass: '',
    apiVer: amsApiVer
  };
}

/**
 * Helper function to make API requests directly to AMS API
 */
export async function makeApiRequest(path: string, method: string = 'GET', headers: Record<string, string> = {}, signal?: AbortSignal): Promise<Response> {
  const isDev = import.meta.env.DEV;
  
  const amsBaseUrl = import.meta.env.VITE_AMS_BASE_URL || getApiSettings()?.url || 'http://46.105.115.223:8181';
  
  const baseUrl = amsBaseUrl.startsWith('http') ? amsBaseUrl : `http://${amsBaseUrl}`;
  
  const fullUrl = isDev 
    ? `/api${path}`
    : `${baseUrl}${path}`;
  
  console.log('Making API request:', { path, method, isDev, fullUrl });
  
  const timeoutSignal = signal || AbortSignal.timeout(30000);
  
  return fetch(fullUrl, {
    method,
    headers,
    signal: timeoutSignal
  });
}

/**
 * Get today's boundaries in Europe/Paris timezone
 * Returns start (today 00:00:00.000) and end (today 23:59:59.999)
 */
export function getTodayParisBoundaries(): { start: Date; end: Date } {
  const now = new Date();
  const parisTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
  
  const start = new Date(parisTime);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(parisTime);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}
