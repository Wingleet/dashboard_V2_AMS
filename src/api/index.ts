/**
 * AMS API Module
 * 
 * Main entry point for all AMS API functionality
 * 
 * Usage:
 * ```typescript
 * import { initAmsApi, loadWpDashboard, amsApi } from './api';
 * 
 * // Initialize at app startup
 * await initAmsApi();
 * 
 * // Load dashboard data
 * const dashboard = await loadWpDashboard({ acReg: 'F-GZCP', wpId: 1234 });
 * 
 * // Direct API calls
 * const aircraft = await amsApi.aircraft.byReg('F-GZCP');
 * ```
 */

// Main init module (most commonly used)
export {
  initAmsApi,
  isApiInitialized,
  resetApi,
  loadWpDashboard,
  preloadWpList,
  invalidateWpCache,
  amsApi,
  clearCache,
  getCacheStats,
  waitForBootstrap,
  isReferentialsLoaded,
  refs,
  computeDashboardCounts,
  type WpDashboardData,
  type DashboardCounts,
  type Aircraft,
  type WorkPackage,
  type WpDetail,
  type WorkOrder,
  type MovItem,
  type CustomerQuote,
} from './amsInit';

// Client module (for advanced use cases)
export {
  amsClient,
  configureClient,
  getClientConfig,
  buildUrl,
  unwrap,
  isError,
  type AmsApiError,
  type AmsResult,
  type AmsClientConfig,
} from './amsClient';

// Cache module (for advanced use cases)
export {
  makeCacheKey,
  get as getFromCache,
  set as setInCache,
  invalidate as invalidateCacheKey,
  invalidatePrefix as invalidateCachePrefix,
  clearAll as clearAllCache,
  deduplicatedFetch,
  CACHE_TTL,
} from './amsCache';

// Endpoints module (for direct endpoint access)
export {
  ENDPOINTS,
  queryBuilders,
  fetchReferentials,
  fetchAircraftByReg,
  fetchAircraftByCustomer,
  fetchWpListByAircraft,
  fetchWpDetail,
  fetchWoListByWorkpack,
  fetchRfqListByAircraft,
  fetchReqListByWpAndLoc,
  fetchPoinListByWpAndLoc,
  fetchCustomerQuotesByWpAndLoc,
  type GenericRef,
  type AmsListResponse,
} from './amsEndpoints';

// Bootstrap module (for referential management)
export {
  bootstrapReferentials,
  resetBootstrap,
  getAcTypes,
  getAcFleet,
  getSettings,
  getAtas,
  getTaskTypes,
  getCraTypes,
  getDelays,
  getMovUrgs,
  getSpecialities,
  getPnTypes,
  getMovTypes,
  findRefById,
  findRefByCode,
  getRefLabel,
  getAtaLabel,
  getTaskTypeLabel,
} from './amsBootstrap';

// Default export for convenient module import
import amsInit from './amsInit';
export default amsInit;
