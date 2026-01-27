/**
 * AMS Init
 * Initialize AMS API and provide orchestration helpers for loading dashboard data
 */

import { configureClient, AmsApiError } from './amsClient';
import { bootstrapReferentials, waitForBootstrap } from './amsBootstrap';
import { clearAll as clearCache, invalidatePrefix } from './amsCache';
import {
  amsApi,
  Aircraft,
  WorkPackage,
  WpDetail,
  WorkOrder,
  MovItem,
  CustomerQuote,
  computeDashboardCounts,
  DashboardCounts,
} from './amsEndpoints';
import { clearToken } from '../utils/api';

// ============================================================================
// INITIALIZATION
// ============================================================================

let isInitialized = false;

/**
 * Initialize the AMS API
 * Call this once at app startup (e.g., in main.tsx or after login)
 */
export async function initAmsApi(options?: {
  onUnauthorized?: () => void;
  skipReferentials?: boolean;
}): Promise<void> {
  if (isInitialized) {
    console.log('[AMS Init] Already initialized');
    return;
  }
  
  console.log('[AMS Init] Initializing AMS API...');
  
  // Configure client
  configureClient({
    baseUrl: '/api',
    timeout: 30000,
    maxRetries: 2,
    retryDelay: 1000,
    onUnauthorized: options?.onUnauthorized || (() => {
      clearToken();
      clearCache();
      window.location.reload();
    }),
  });
  
  // Bootstrap referentials (non-blocking by default)
  if (!options?.skipReferentials) {
    // Start loading but don't wait
    bootstrapReferentials().catch(err => {
      console.warn('[AMS Init] Referentials bootstrap failed:', err);
    });
  }
  
  isInitialized = true;
  console.log('[AMS Init] Initialization complete');
}

/**
 * Check if API is initialized
 */
export function isApiInitialized(): boolean {
  return isInitialized;
}

/**
 * Reset API state (e.g., on logout)
 */
export function resetApi(): void {
  clearCache();
  isInitialized = false;
}

// ============================================================================
// DASHBOARD LOADING
// ============================================================================

/**
 * Dashboard data structure returned by loadWpDashboard
 */
export interface WpDashboardData {
  aircraft: Aircraft | null;
  workPackage: WorkPackage | null;
  wpDetail: WpDetail | null;
  workOrders: WorkOrder[];
  rfqList: MovItem[];
  reqList: MovItem[];
  poinList: MovItem[];
  customerQuotes: CustomerQuote[];
  counts: DashboardCounts | null;
  errors: AmsApiError[];
}

/**
 * Empty dashboard data
 */
const emptyDashboard: WpDashboardData = {
  aircraft: null,
  workPackage: null,
  wpDetail: null,
  workOrders: [],
  rfqList: [],
  reqList: [],
  poinList: [],
  customerQuotes: [],
  counts: null,
  errors: [],
};

/**
 * Load all dashboard data for a work package
 * Orchestrates multiple API calls and returns consolidated results
 * 
 * @param params.acReg - Aircraft registration (e.g., "F-GZCP")
 * @param params.acId - Aircraft ID (alternative to acReg)
 * @param params.wpId - Work Package ID
 * @param params.locFromRefId - Location From Reference ID (for REQ list)
 * @param params.locToRefId - Location To Reference ID (for POIN and CQ lists)
 */
export async function loadWpDashboard(params: {
  acReg?: string;
  acId?: number;
  wpId: number;
  locFromRefId?: number;
  locToRefId?: number;
}): Promise<WpDashboardData> {
  const { acReg, wpId, locFromRefId, locToRefId } = params;
  let { acId } = params;
  
  const result: WpDashboardData = { ...emptyDashboard, errors: [] };
  
  console.log('[AMS Init] Loading WP Dashboard:', params);
  const startTime = Date.now();
  
  try {
    // Step 1: Get Aircraft (if acReg provided but not acId)
    if (acReg && !acId) {
      const acResult = await amsApi.aircraft.byReg(acReg);
      if (acResult.ok && acResult.data.length > 0) {
        result.aircraft = acResult.data[0];
        acId = result.aircraft.ACID;
      } else if (!acResult.ok) {
        result.errors.push(acResult.error);
      }
    }
    
    // If we still don't have an acId, we can't proceed with most calls
    if (!acId) {
      console.warn('[AMS Init] No aircraft ID available');
      return result;
    }
    
    // Step 2: Load data in parallel where possible
    const [wpDetailResult, woListResult, rfqResult] = await Promise.all([
      // WP Detail (dashboard summary)
      amsApi.workPackages.detail(acId, wpId),
      // Work Orders
      amsApi.workOrders.listByWorkpack(wpId),
      // RFQ List
      amsApi.movItems.rfqList(acId),
    ]);
    
    // Process WP Detail
    if (wpDetailResult.ok && wpDetailResult.data.length > 0) {
      result.wpDetail = wpDetailResult.data[0];
      result.counts = computeDashboardCounts(result.wpDetail);
    } else if (!wpDetailResult.ok) {
      result.errors.push(wpDetailResult.error);
    }
    
    // Process Work Orders
    if (woListResult.ok) {
      result.workOrders = woListResult.data;
    } else {
      result.errors.push(woListResult.error);
    }
    
    // Process RFQ
    if (rfqResult.ok) {
      result.rfqList = rfqResult.data;
    } else {
      result.errors.push(rfqResult.error);
    }
    
    // Step 3: Load location-dependent data if IDs provided
    const locationPromises: Promise<void>[] = [];
    
    if (locFromRefId) {
      locationPromises.push(
        amsApi.movItems.reqList(locFromRefId, wpId).then(reqResult => {
          if (reqResult.ok) {
            result.reqList = reqResult.data;
          } else {
            result.errors.push(reqResult.error);
          }
        })
      );
    }
    
    if (locToRefId && acReg) {
      locationPromises.push(
        amsApi.movItems.poinList(locToRefId, acReg, wpId).then(poinResult => {
          if (poinResult.ok) {
            result.poinList = poinResult.data;
          } else {
            result.errors.push(poinResult.error);
          }
        })
      );
      
      locationPromises.push(
        amsApi.movItems.customerQuotes(locToRefId, acReg, wpId).then(cqResult => {
          if (cqResult.ok) {
            result.customerQuotes = cqResult.data;
          } else {
            result.errors.push(cqResult.error);
          }
        })
      );
    }
    
    // Wait for location-dependent calls
    if (locationPromises.length > 0) {
      await Promise.all(locationPromises);
    }
    
  } catch (error) {
    console.error('[AMS Init] Unexpected error loading dashboard:', error);
    result.errors.push({
      type: 'unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      endpoint: 'loadWpDashboard',
    });
  }
  
  const elapsed = Date.now() - startTime;
  console.log(`[AMS Init] Dashboard loaded in ${elapsed}ms`, {
    wpDetail: !!result.wpDetail,
    workOrders: result.workOrders.length,
    rfqList: result.rfqList.length,
    errors: result.errors.length,
  });
  
  return result;
}

/**
 * Preload work package list for an aircraft
 * Useful for populating a WP selector
 */
export async function preloadWpList(acId: number): Promise<WorkPackage[]> {
  const result = await amsApi.workPackages.listByAircraft(acId);
  if (result.ok) {
    return result.data;
  }
  console.error('[AMS Init] Failed to preload WP list:', result.error);
  return [];
}

/**
 * Invalidate dashboard cache for a specific WP
 * Call this after making changes that affect the dashboard
 */
export function invalidateWpCache(wpId: number): void {
  invalidatePrefix(`/v1/wpdetaillist?`);
  invalidatePrefix(`/v1/eche?echeworkpackid=${wpId}`);
  console.log(`[AMS Init] Invalidated cache for WP ${wpId}`);
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  // Re-export from amsEndpoints for convenience
  amsApi,
  computeDashboardCounts,
  type DashboardCounts,
  type Aircraft,
  type WorkPackage,
  type WpDetail,
  type WorkOrder,
  type MovItem,
  type CustomerQuote,
} from './amsEndpoints';

export {
  // Re-export cache utilities
  clearAll as clearCache,
  getCacheStats,
} from './amsCache';

export {
  // Re-export bootstrap utilities
  waitForBootstrap,
  isReferentialsLoaded,
  refs,
} from './amsBootstrap';

export default {
  init: initAmsApi,
  isInitialized: isApiInitialized,
  reset: resetApi,
  loadDashboard: loadWpDashboard,
  preloadWpList,
  invalidateWpCache,
  api: amsApi,
};
