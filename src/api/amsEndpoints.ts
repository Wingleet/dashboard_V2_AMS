/**
 * AMS Endpoints
 * Centralized endpoint definitions with query builders and typed fetch functions
 */

import { amsClient, AmsResult } from './amsClient';
import { deduplicatedFetch, makeCacheKey, CACHE_TTL } from './amsCache';

// ============================================================================
// TYPES
// ============================================================================

// Generic list response wrapper (most AMS endpoints return arrays)
export type AmsListResponse<T> = T[];

// Aircraft types
export interface Aircraft {
  ACID: number;
  AC_REG: string;
  AC_MSN: string;
  AC_TYPE: string;
  CUSTOMER_ID: number;
  CUSTOMER_NAME?: string;
  [key: string]: unknown;
}

// Work Package types
export interface WorkPackage {
  WP_ID: number;
  WP_NUMBER: string;
  WP_STATUS: string;
  ACID: number;
  AC_REG?: string;
  START_DATE?: string;
  END_DATE?: string;
  [key: string]: unknown;
}

// Work Package Detail (dashboard summary)
export interface WpDetail {
  WP_ID: number;
  AC_MSN: number;
  WO_Total: number;
  WO_Total_Routine: number;
  WO_Total_RectWorks_Excl: number;
  WO_Total_AddWOrks: number;
  WO_Total_RectWorks_Incl: number;
  WO_Total_Storage: number;
  WO_Total_Routine_Closed: number;
  WO_Total_RectWorks_Excl_Closed: number;
  WO_Total_AddWorks_Closed: number;
  WO_Total_RectWorks_Incl_Closed: number;
  WO_Total_Storage_Closed: number;
  WO_Total_MH_Opened: number;
  WO_Total_Routine_MH_Opened: number;
  WO_Total_RectWorks_Excl_MH_Opened: number;
  WO_Total_AddWorks_MH_Opened: number;
  WO_Total_RectWorks_Incl_MH_Opened: number;
  WO_Total_Storage_MH_Opened: number;
  WO_Total_MH_Closed: number;
  WO_Total_Routine_MH_Closed: number;
  WO_Total_RectWorks_Excl_MH_Closed: number;
  WO_Total_AddWorks_MH_Closed: number;
  WO_Total_RectWorks_Incl_MH_Closed: number;
  WO_Total_Storage_MH_Closed: number;
  PARTS_IN_RFQ: number;
  PARTS_TO_BE_QUOTED: number;
  PARTS_TO_BE_ORDERED: number;
  PARTS_TO_BE_ORDERED_POIN: number;
  PARTS_ETA_PAST: number;
  PARTS_ETA_ON_TIME: number;
  PARTS_NO_ETA: number;
  BUYER_CQ_TO_APPROVE: number;
  TECHOFFICE_CQ_TO_APPROVE: number;
  TOOLS_NOT_RETURNED: number;
  PARTS_TO_BE_ISSUED: number;
  PARTS_TO_BE_ISSUED_POIN: number;
  PARTS_UNDER_CLAIM: number;
  CQ_TO_BE_SENT: number;
  CQ_PENDING_CUST_APPROVAL: number;
  PARTS_REQ_ETA_PAST: number;
  PARTS_REQ_ETA_ON_TIME: number;
  PARTS_REQ_NO_ETA: number;
  [key: string]: unknown;
}

// Work Order types
export interface WorkOrder {
  ECHE_ID: number;
  WO_NUMBER: string;
  WO_STATUS: string;
  WO_TYPE: string;
  WP_ID: number;
  DESCRIPTION?: string;
  MH_ESTIMATED?: number;
  MH_ACTUAL?: number;
  [key: string]: unknown;
}

// Movement Item types (RFQ, REQ, POIN, etc.)
export interface MovItem {
  MOV_ID: number;
  MOV_TYPE: string;
  PART_NUMBER: string;
  QUANTITY: number;
  STATUS: string;
  ETA?: string;
  WP_ID?: number;
  WO_ID?: number;
  [key: string]: unknown;
}

// Customer Quote
export interface CustomerQuote {
  CQ_ID: number;
  CQ_NUMBER: string;
  STATUS: string;
  TOTAL_AMOUNT?: number;
  WP_ID?: number;
  [key: string]: unknown;
}

// Referential types
export interface GenericRef {
  ID: number;
  CODE: string;
  LABEL: string;
  [key: string]: unknown;
}

// ============================================================================
// ENDPOINT PATHS
// ============================================================================

export const ENDPOINTS = {
  // Referentials
  GEN_ACTYPE: '/v1/genactype',
  GEN_ACFLEET: '/v1/acfleet',
  GEN_SETTINGS: '/v1/gensettings',
  GEN_ATA: '/v1/genata',
  GEN_TASKTYPE: '/v1/gentasktype',
  GEN_CRATYPE: '/v1/gencratype',
  GEN_DELAY: '/v1/gendelay',
  GEN_MOVURG: '/v1/genmovurg',
  GEN_SPECIALITY: '/v1/genspeciality',
  GEN_PNTYPE: '/v1/genpntype',
  GEN_MOVTYPE: '/v1/genmovtype',
  
  // Aircraft
  AC_LIST: '/v1/ac/list',
  
  // Work Packages
  WP_LIST: '/v1/wplist',
  WP_DETAIL: '/v1/wpdetaillist',
  
  // Work Orders
  WO_LIST: '/v1/eche',
  
  // Movement Items
  MOV_RFQ_LIST: '/v1/movitem/rfqlist',
  MOV_REQ_LIST: '/v1/movitem/reqlist',
  MOV_POIN_LIST: '/v1/movitem/poinlist',
  MOV_CQ_LIST: '/v1/movitem/cusomerquotes',
  MOV_INVOICE_LIST: '/v1/movitem/invoiceoutlist',
  MOV_WP_LIST: '/v1/movitem/wplist',
  MOV_TAG_LIST: '/v1/movitem/taglist',
} as const;

// ============================================================================
// QUERY BUILDERS
// ============================================================================

export const queryBuilders = {
  // Aircraft queries
  aircraftByReg: (acRegistr: string) => ({ acregistr: acRegistr }),
  aircraftByCustomer: (customerId: number, includeWoList: boolean = false) => ({
    customerid: String(customerId),
    includewolist: String(includeWoList),
  }),
  
  // Work Package queries
  wpListByAircraft: (acId: number) => ({ echeacid: String(acId) }),
  wpDetail: (acId: number, wpId: number) => ({
    acid: String(acId),
    echeworkpackid: String(wpId),
  }),
  
  // Work Order queries
  woListByWorkpack: (wpId: number) => ({ echeworkpackid: String(wpId) }),
  
  // Movement Item queries
  rfqListByAircraft: (acId: number) => ({ forac: String(acId) }),
  reqListByWpAndLoc: (locFromRefId: number, wpId: number, includeWoList: boolean = true) => ({
    LocFromREFID: String(locFromRefId),
    includewolist: String(includeWoList),
    WP: String(wpId),
  }),
  poinListByWpAndLoc: (locToRefId: number, acRegistr: string, wpId: number, includeWoList: boolean = true) => ({
    loctorefid: String(locToRefId),
    includewolist: String(includeWoList),
    acregistr: acRegistr,
    WP: String(wpId),
  }),
  customerQuotesByWpAndLoc: (locToRefId: number, acRegistr: string, wpId: number) => ({
    loctorefid: String(locToRefId),
    acregistr: acRegistr,
    WP: String(wpId),
  }),
  invoiceListByWpAndLoc: (locToRefId: number, acRegistr: string, wpId: number, includeWoList: boolean = true) => ({
    loctorefid: String(locToRefId),
    acregistr: acRegistr,
    includewolist: String(includeWoList),
    WP: String(wpId),
  }),
  movWpListByLocAndAc: (locToRefId: number, acId: number) => ({
    loctorefid: String(locToRefId),
    forac: String(acId),
  }),
  tagListByWp: (acRegistr: string, userId: number, wpId: number) => ({
    acregistr: acRegistr,
    userid: String(userId),
    WP: String(wpId),
  }),
};

// ============================================================================
// FETCH FUNCTIONS - REFERENTIALS
// ============================================================================

async function fetchReferential<T>(endpoint: string): Promise<T[]> {
  const cacheKey = makeCacheKey(endpoint);
  
  return deduplicatedFetch<T[]>(
    cacheKey,
    async () => {
      const result = await amsClient.get<T[]>(endpoint);
      if (!result.ok) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    CACHE_TTL.REFERENTIALS,
    true // Persist to localStorage
  );
}

export const fetchReferentials = {
  genAcType: () => fetchReferential<GenericRef>(ENDPOINTS.GEN_ACTYPE),
  acFleet: () => fetchReferential<GenericRef>(ENDPOINTS.GEN_ACFLEET),
  genSettings: () => fetchReferential<GenericRef>(ENDPOINTS.GEN_SETTINGS),
  genAta: () => fetchReferential<GenericRef>(ENDPOINTS.GEN_ATA),
  genTaskType: () => fetchReferential<GenericRef>(ENDPOINTS.GEN_TASKTYPE),
  genCraType: () => fetchReferential<GenericRef>(ENDPOINTS.GEN_CRATYPE),
  genDelay: () => fetchReferential<GenericRef>(ENDPOINTS.GEN_DELAY),
  genMovUrg: () => fetchReferential<GenericRef>(ENDPOINTS.GEN_MOVURG),
  genSpeciality: () => fetchReferential<GenericRef>(ENDPOINTS.GEN_SPECIALITY),
  genPnType: () => fetchReferential<GenericRef>(ENDPOINTS.GEN_PNTYPE),
  genMovType: () => fetchReferential<GenericRef>(ENDPOINTS.GEN_MOVTYPE),
};

// ============================================================================
// FETCH FUNCTIONS - AIRCRAFT
// ============================================================================

export async function fetchAircraftByReg(acRegistr: string): Promise<AmsResult<Aircraft[]>> {
  const params = queryBuilders.aircraftByReg(acRegistr);
  const cacheKey = makeCacheKey(ENDPOINTS.AC_LIST, params);
  
  try {
    const data = await deduplicatedFetch<Aircraft[]>(
      cacheKey,
      async () => {
        const result = await amsClient.get<Aircraft[]>(ENDPOINTS.AC_LIST, params);
        if (!result.ok) throw new Error(result.error.message);
        return result.data;
      },
      CACHE_TTL.DEFAULT
    );
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: {
        type: 'unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        endpoint: ENDPOINTS.AC_LIST,
        params,
      },
    };
  }
}

export async function fetchAircraftByCustomer(customerId: number): Promise<AmsResult<Aircraft[]>> {
  const params = queryBuilders.aircraftByCustomer(customerId);
  const cacheKey = makeCacheKey(ENDPOINTS.AC_LIST, params);
  
  try {
    const data = await deduplicatedFetch<Aircraft[]>(
      cacheKey,
      async () => {
        const result = await amsClient.get<Aircraft[]>(ENDPOINTS.AC_LIST, params);
        if (!result.ok) throw new Error(result.error.message);
        return result.data;
      },
      CACHE_TTL.DEFAULT
    );
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: {
        type: 'unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        endpoint: ENDPOINTS.AC_LIST,
        params,
      },
    };
  }
}

// ============================================================================
// FETCH FUNCTIONS - WORK PACKAGES
// ============================================================================

export async function fetchWpListByAircraft(acId: number): Promise<AmsResult<WorkPackage[]>> {
  const params = queryBuilders.wpListByAircraft(acId);
  const cacheKey = makeCacheKey(ENDPOINTS.WP_LIST, params);
  
  try {
    const data = await deduplicatedFetch<WorkPackage[]>(
      cacheKey,
      async () => {
        const result = await amsClient.get<WorkPackage[]>(ENDPOINTS.WP_LIST, params);
        if (!result.ok) throw new Error(result.error.message);
        return result.data;
      },
      CACHE_TTL.DEFAULT
    );
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: {
        type: 'unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        endpoint: ENDPOINTS.WP_LIST,
        params,
      },
    };
  }
}

export async function fetchWpDetail(acId: number, wpId: number): Promise<AmsResult<WpDetail[]>> {
  const params = queryBuilders.wpDetail(acId, wpId);
  const cacheKey = makeCacheKey(ENDPOINTS.WP_DETAIL, params);
  
  try {
    const data = await deduplicatedFetch<WpDetail[]>(
      cacheKey,
      async () => {
        const result = await amsClient.get<WpDetail[]>(ENDPOINTS.WP_DETAIL, params);
        if (!result.ok) throw new Error(result.error.message);
        return result.data;
      },
      CACHE_TTL.SHORT // Short TTL for dashboard data
    );
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: {
        type: 'unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        endpoint: ENDPOINTS.WP_DETAIL,
        params,
      },
    };
  }
}

// ============================================================================
// FETCH FUNCTIONS - WORK ORDERS
// ============================================================================

export async function fetchWoListByWorkpack(wpId: number): Promise<AmsResult<WorkOrder[]>> {
  const params = queryBuilders.woListByWorkpack(wpId);
  const cacheKey = makeCacheKey(ENDPOINTS.WO_LIST, params);
  
  try {
    const data = await deduplicatedFetch<WorkOrder[]>(
      cacheKey,
      async () => {
        const result = await amsClient.get<WorkOrder[]>(ENDPOINTS.WO_LIST, params);
        if (!result.ok) throw new Error(result.error.message);
        return result.data;
      },
      CACHE_TTL.DEFAULT
    );
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: {
        type: 'unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        endpoint: ENDPOINTS.WO_LIST,
        params,
      },
    };
  }
}

// ============================================================================
// FETCH FUNCTIONS - MOVEMENT ITEMS
// ============================================================================

export async function fetchRfqListByAircraft(acId: number): Promise<AmsResult<MovItem[]>> {
  const params = queryBuilders.rfqListByAircraft(acId);
  const cacheKey = makeCacheKey(ENDPOINTS.MOV_RFQ_LIST, params);
  
  try {
    const data = await deduplicatedFetch<MovItem[]>(
      cacheKey,
      async () => {
        const result = await amsClient.get<MovItem[]>(ENDPOINTS.MOV_RFQ_LIST, params);
        if (!result.ok) throw new Error(result.error.message);
        return result.data;
      },
      CACHE_TTL.DEFAULT
    );
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: {
        type: 'unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        endpoint: ENDPOINTS.MOV_RFQ_LIST,
        params,
      },
    };
  }
}

export async function fetchReqListByWpAndLoc(
  locFromRefId: number,
  wpId: number
): Promise<AmsResult<MovItem[]>> {
  const params = queryBuilders.reqListByWpAndLoc(locFromRefId, wpId);
  const cacheKey = makeCacheKey(ENDPOINTS.MOV_REQ_LIST, params);
  
  try {
    const data = await deduplicatedFetch<MovItem[]>(
      cacheKey,
      async () => {
        const result = await amsClient.get<MovItem[]>(ENDPOINTS.MOV_REQ_LIST, params);
        if (!result.ok) throw new Error(result.error.message);
        return result.data;
      },
      CACHE_TTL.DEFAULT
    );
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: {
        type: 'unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        endpoint: ENDPOINTS.MOV_REQ_LIST,
        params,
      },
    };
  }
}

export async function fetchPoinListByWpAndLoc(
  locToRefId: number,
  acRegistr: string,
  wpId: number
): Promise<AmsResult<MovItem[]>> {
  const params = queryBuilders.poinListByWpAndLoc(locToRefId, acRegistr, wpId);
  const cacheKey = makeCacheKey(ENDPOINTS.MOV_POIN_LIST, params);
  
  try {
    const data = await deduplicatedFetch<MovItem[]>(
      cacheKey,
      async () => {
        const result = await amsClient.get<MovItem[]>(ENDPOINTS.MOV_POIN_LIST, params);
        if (!result.ok) throw new Error(result.error.message);
        return result.data;
      },
      CACHE_TTL.DEFAULT
    );
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: {
        type: 'unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        endpoint: ENDPOINTS.MOV_POIN_LIST,
        params,
      },
    };
  }
}

export async function fetchCustomerQuotesByWpAndLoc(
  locToRefId: number,
  acRegistr: string,
  wpId: number
): Promise<AmsResult<CustomerQuote[]>> {
  const params = queryBuilders.customerQuotesByWpAndLoc(locToRefId, acRegistr, wpId);
  const cacheKey = makeCacheKey(ENDPOINTS.MOV_CQ_LIST, params);
  
  try {
    const data = await deduplicatedFetch<CustomerQuote[]>(
      cacheKey,
      async () => {
        const result = await amsClient.get<CustomerQuote[]>(ENDPOINTS.MOV_CQ_LIST, params);
        if (!result.ok) throw new Error(result.error.message);
        return result.data;
      },
      CACHE_TTL.DEFAULT
    );
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: {
        type: 'unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        endpoint: ENDPOINTS.MOV_CQ_LIST,
        params,
      },
    };
  }
}

// ============================================================================
// AGGREGATION HELPERS
// ============================================================================

export interface DashboardCounts {
  totalWO: number;
  closedWO: number;
  openMH: number;
  closedMH: number;
  partsInRfq: number;
  partsToBeOrdered: number;
  partsToBeIssued: number;
  partsEtaPast: number;
  cqToApprove: number;
  toolsNotReturned: number;
}

export function computeDashboardCounts(wpDetail: WpDetail): DashboardCounts {
  const closedWO = 
    wpDetail.WO_Total_Routine_Closed +
    wpDetail.WO_Total_RectWorks_Excl_Closed +
    wpDetail.WO_Total_AddWorks_Closed +
    wpDetail.WO_Total_RectWorks_Incl_Closed +
    wpDetail.WO_Total_Storage_Closed;
    
  return {
    totalWO: wpDetail.WO_Total,
    closedWO,
    openMH: wpDetail.WO_Total_MH_Opened,
    closedMH: wpDetail.WO_Total_MH_Closed,
    partsInRfq: wpDetail.PARTS_IN_RFQ,
    partsToBeOrdered: wpDetail.PARTS_TO_BE_ORDERED + wpDetail.PARTS_TO_BE_ORDERED_POIN,
    partsToBeIssued: wpDetail.PARTS_TO_BE_ISSUED + wpDetail.PARTS_TO_BE_ISSUED_POIN,
    partsEtaPast: wpDetail.PARTS_ETA_PAST + wpDetail.PARTS_REQ_ETA_PAST,
    cqToApprove: wpDetail.BUYER_CQ_TO_APPROVE + wpDetail.TECHOFFICE_CQ_TO_APPROVE,
    toolsNotReturned: wpDetail.TOOLS_NOT_RETURNED,
  };
}

// Export all fetch functions as a namespace
export const amsApi = {
  referentials: fetchReferentials,
  aircraft: {
    byReg: fetchAircraftByReg,
    byCustomer: fetchAircraftByCustomer,
  },
  workPackages: {
    listByAircraft: fetchWpListByAircraft,
    detail: fetchWpDetail,
  },
  workOrders: {
    listByWorkpack: fetchWoListByWorkpack,
  },
  movItems: {
    rfqList: fetchRfqListByAircraft,
    reqList: fetchReqListByWpAndLoc,
    poinList: fetchPoinListByWpAndLoc,
    customerQuotes: fetchCustomerQuotesByWpAndLoc,
  },
  utils: {
    computeDashboardCounts,
  },
};

export default amsApi;
