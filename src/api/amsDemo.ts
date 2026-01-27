/**
 * AMS Demo
 * Example usage of the AMS API client, endpoints, and cache
 * 
 * This file demonstrates how to:
 * 1. Initialize the API
 * 2. Load aircraft and work packages
 * 3. Load full dashboard data
 * 4. Use referentials
 * 5. Handle errors
 */

import {
  initAmsApi,
  loadWpDashboard,
  preloadWpList,
  amsApi,
  WpDashboardData,
  Aircraft,
  WorkPackage,
} from './amsInit';
import { waitForBootstrap, refs } from './amsBootstrap';
import { getCacheStats } from './amsCache';

// ============================================================================
// EXAMPLE 1: Basic Initialization
// ============================================================================

/**
 * Initialize the AMS API at app startup
 * Call this in main.tsx or after successful login
 */
export async function initializeApp(): Promise<void> {
  await initAmsApi({
    onUnauthorized: () => {
      console.log('Session expired - redirecting to login');
      // In a real app: clear state, redirect to login
      window.location.href = '/login';
    },
  });
  
  // Optionally wait for referentials to be loaded
  await waitForBootstrap();
  
  console.log('App initialized with cache stats:', getCacheStats());
}

// ============================================================================
// EXAMPLE 2: Load Aircraft by Registration
// ============================================================================

/**
 * Find an aircraft by its registration
 */
export async function findAircraft(registration: string): Promise<Aircraft | null> {
  const result = await amsApi.aircraft.byReg(registration);
  
  if (!result.ok) {
    console.error('Failed to find aircraft:', result.error.message);
    return null;
  }
  
  if (result.data.length === 0) {
    console.warn('No aircraft found with registration:', registration);
    return null;
  }
  
  return result.data[0];
}

// ============================================================================
// EXAMPLE 3: Load Work Package List for Aircraft
// ============================================================================

/**
 * Get all work packages for an aircraft
 */
export async function getWorkPackages(acId: number): Promise<WorkPackage[]> {
  const wpList = await preloadWpList(acId);
  
  console.log(`Found ${wpList.length} work packages for aircraft ${acId}`);
  wpList.forEach(wp => {
    console.log(`  - WP ${wp.WP_ID}: ${wp.WP_NUMBER} (${wp.WP_STATUS})`);
  });
  
  return wpList;
}

// ============================================================================
// EXAMPLE 4: Load Full Dashboard Data
// ============================================================================

/**
 * Load complete dashboard data for a work package
 * This is the main function you'll use in the Dashboard component
 */
export async function loadDashboardExample(
  acReg: string,
  wpId: number,
  locFromRefId?: number,
  locToRefId?: number
): Promise<WpDashboardData> {
  console.log(`Loading dashboard for ${acReg} / WP ${wpId}...`);
  
  const dashboard = await loadWpDashboard({
    acReg,
    wpId,
    locFromRefId,
    locToRefId,
  });
  
  // Log results
  if (dashboard.wpDetail) {
    console.log('WP Detail loaded:', {
      WP_ID: dashboard.wpDetail.WP_ID,
      AC_MSN: dashboard.wpDetail.AC_MSN,
      WO_Total: dashboard.wpDetail.WO_Total,
    });
  }
  
  if (dashboard.counts) {
    console.log('Dashboard counts:', dashboard.counts);
  }
  
  console.log('Work Orders:', dashboard.workOrders.length);
  console.log('RFQ Items:', dashboard.rfqList.length);
  console.log('REQ Items:', dashboard.reqList.length);
  console.log('POIN Items:', dashboard.poinList.length);
  console.log('Customer Quotes:', dashboard.customerQuotes.length);
  
  // Handle errors
  if (dashboard.errors.length > 0) {
    console.warn('Some data failed to load:');
    dashboard.errors.forEach(err => {
      console.warn(`  - ${err.endpoint}: ${err.message}`);
    });
  }
  
  return dashboard;
}

// ============================================================================
// EXAMPLE 5: Using Referentials
// ============================================================================

/**
 * Example of using referential data
 */
export function useReferentialsExample(): void {
  // Get all ATA codes
  const atas = refs.atas();
  console.log(`Loaded ${atas.length} ATA codes`);
  
  // Get all task types
  const taskTypes = refs.taskTypes();
  console.log(`Loaded ${taskTypes.length} task types`);
  
  // Look up specific values
  const ataLabel = refs.getAtaLabel(21); // e.g., "Air Conditioning"
  console.log(`ATA 21: ${ataLabel}`);
  
  // Find by code
  const acType = refs.findByCode(refs.acTypes(), 'A320');
  if (acType) {
    console.log(`A320: ${acType.LABEL}`);
  }
}

// ============================================================================
// EXAMPLE 6: Complete Flow
// ============================================================================

/**
 * Complete example: init -> find aircraft -> select WP -> load dashboard
 */
export async function completeFlowExample(): Promise<void> {
  // Step 1: Initialize
  await initializeApp();
  
  // Step 2: Find aircraft
  const aircraft = await findAircraft('F-GZCP');
  if (!aircraft) {
    console.error('Aircraft not found');
    return;
  }
  console.log('Found aircraft:', aircraft.AC_REG, 'MSN:', aircraft.AC_MSN);
  
  // Step 3: Get work packages
  const wpList = await getWorkPackages(aircraft.ACID);
  if (wpList.length === 0) {
    console.error('No work packages found');
    return;
  }
  
  // Step 4: Load dashboard for first WP
  const selectedWp = wpList[0];
  const dashboard = await loadDashboardExample(
    aircraft.AC_REG,
    selectedWp.WP_ID,
    undefined, // locFromRefId - set if you have it
    undefined  // locToRefId - set if you have it
  );
  
  // Step 5: Use the data
  if (dashboard.counts) {
    console.log('=== Dashboard Summary ===');
    console.log(`Total WO: ${dashboard.counts.totalWO}`);
    console.log(`Closed WO: ${dashboard.counts.closedWO}`);
    console.log(`Open MH: ${dashboard.counts.openMH}`);
    console.log(`Closed MH: ${dashboard.counts.closedMH}`);
    console.log(`Parts to order: ${dashboard.counts.partsToBeOrdered}`);
    console.log(`Parts ETA past: ${dashboard.counts.partsEtaPast}`);
    console.log(`CQ to approve: ${dashboard.counts.cqToApprove}`);
    console.log(`Tools not returned: ${dashboard.counts.toolsNotReturned}`);
  }
  
  // Step 6: Check cache efficiency
  console.log('Cache stats after loading:', getCacheStats());
}

// ============================================================================
// HOOK EXAMPLE: useDashboard
// ============================================================================

/**
 * Example React hook pattern (to be implemented in a hooks file)
 * 
 * Usage in a component:
 * ```
 * const { data, loading, error, refresh } = useDashboard(wpId, acReg);
 * ```
 */
export const useDashboardPattern = `
import { useState, useEffect, useCallback } from 'react';
import { loadWpDashboard, WpDashboardData, invalidateWpCache } from '../api/amsInit';

export function useDashboard(wpId: number, acReg: string) {
  const [data, setData] = useState<WpDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!wpId || !acReg) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await loadWpDashboard({ wpId, acReg });
      setData(result);
      
      if (result.errors.length > 0) {
        setError(result.errors.map(e => e.message).join(', '));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [wpId, acReg]);

  const refresh = useCallback(() => {
    invalidateWpCache(wpId);
    load();
  }, [wpId, load]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refresh };
}
`;

export default {
  initializeApp,
  findAircraft,
  getWorkPackages,
  loadDashboardExample,
  useReferentialsExample,
  completeFlowExample,
};
