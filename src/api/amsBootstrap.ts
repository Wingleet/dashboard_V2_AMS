/**
 * AMS Bootstrap
 * Loads referentials at startup and maintains a shared cache
 */

import { fetchReferentials, GenericRef } from './amsEndpoints';
import { get, set, CACHE_TTL } from './amsCache';

// ============================================================================
// REFERENTIAL CACHE
// ============================================================================

// In-memory referential store for quick lookup
interface ReferentialStore {
  acTypes: GenericRef[];
  acFleet: GenericRef[];
  settings: GenericRef[];
  atas: GenericRef[];
  taskTypes: GenericRef[];
  craTypes: GenericRef[];
  delays: GenericRef[];
  movUrgs: GenericRef[];
  specialities: GenericRef[];
  pnTypes: GenericRef[];
  movTypes: GenericRef[];
}

const emptyStore: ReferentialStore = {
  acTypes: [],
  acFleet: [],
  settings: [],
  atas: [],
  taskTypes: [],
  craTypes: [],
  delays: [],
  movUrgs: [],
  specialities: [],
  pnTypes: [],
  movTypes: [],
};

let referentialStore: ReferentialStore = { ...emptyStore };
let isBootstrapped = false;
let bootstrapPromise: Promise<void> | null = null;

// ============================================================================
// BOOTSTRAP FUNCTIONS
// ============================================================================

/**
 * Load all referentials in parallel
 * Called once at app startup
 */
export async function bootstrapReferentials(): Promise<void> {
  // Prevent multiple simultaneous bootstrap calls
  if (bootstrapPromise) {
    return bootstrapPromise;
  }
  
  if (isBootstrapped) {
    return;
  }
  
  bootstrapPromise = (async () => {
    console.log('[AMS Bootstrap] Loading referentials...');
    const startTime = Date.now();
    
    try {
      // Load all referentials in parallel for speed
      const [
        acTypes,
        acFleet,
        settings,
        atas,
        taskTypes,
        craTypes,
        delays,
        movUrgs,
        specialities,
        pnTypes,
        movTypes,
      ] = await Promise.all([
        fetchReferentials.genAcType().catch(() => []),
        fetchReferentials.acFleet().catch(() => []),
        fetchReferentials.genSettings().catch(() => []),
        fetchReferentials.genAta().catch(() => []),
        fetchReferentials.genTaskType().catch(() => []),
        fetchReferentials.genCraType().catch(() => []),
        fetchReferentials.genDelay().catch(() => []),
        fetchReferentials.genMovUrg().catch(() => []),
        fetchReferentials.genSpeciality().catch(() => []),
        fetchReferentials.genPnType().catch(() => []),
        fetchReferentials.genMovType().catch(() => []),
      ]);
      
      // Update the store
      referentialStore = {
        acTypes,
        acFleet,
        settings,
        atas,
        taskTypes,
        craTypes,
        delays,
        movUrgs,
        specialities,
        pnTypes,
        movTypes,
      };
      
      isBootstrapped = true;
      
      const elapsed = Date.now() - startTime;
      console.log(`[AMS Bootstrap] Referentials loaded in ${elapsed}ms`);
      console.log('[AMS Bootstrap] Loaded counts:', {
        acTypes: acTypes.length,
        acFleet: acFleet.length,
        atas: atas.length,
        taskTypes: taskTypes.length,
      });
      
    } catch (error) {
      console.error('[AMS Bootstrap] Failed to load referentials:', error);
      // Don't throw - app should work even without referentials
    } finally {
      bootstrapPromise = null;
    }
  })();
  
  return bootstrapPromise;
}

/**
 * Get bootstrap status
 */
export function isReferentialsLoaded(): boolean {
  return isBootstrapped;
}

/**
 * Wait for bootstrap to complete
 */
export async function waitForBootstrap(): Promise<void> {
  if (isBootstrapped) return;
  if (bootstrapPromise) {
    await bootstrapPromise;
  }
}

// ============================================================================
// REFERENTIAL ACCESSORS
// ============================================================================

export function getAcTypes(): GenericRef[] {
  return referentialStore.acTypes;
}

export function getAcFleet(): GenericRef[] {
  return referentialStore.acFleet;
}

export function getSettings(): GenericRef[] {
  return referentialStore.settings;
}

export function getAtas(): GenericRef[] {
  return referentialStore.atas;
}

export function getTaskTypes(): GenericRef[] {
  return referentialStore.taskTypes;
}

export function getCraTypes(): GenericRef[] {
  return referentialStore.craTypes;
}

export function getDelays(): GenericRef[] {
  return referentialStore.delays;
}

export function getMovUrgs(): GenericRef[] {
  return referentialStore.movUrgs;
}

export function getSpecialities(): GenericRef[] {
  return referentialStore.specialities;
}

export function getPnTypes(): GenericRef[] {
  return referentialStore.pnTypes;
}

export function getMovTypes(): GenericRef[] {
  return referentialStore.movTypes;
}

// ============================================================================
// LOOKUP HELPERS
// ============================================================================

/**
 * Find a referential by ID
 */
export function findRefById(refs: GenericRef[], id: number): GenericRef | undefined {
  return refs.find(r => r.ID === id);
}

/**
 * Find a referential by CODE
 */
export function findRefByCode(refs: GenericRef[], code: string): GenericRef | undefined {
  return refs.find(r => r.CODE === code);
}

/**
 * Get label for a referential ID
 */
export function getRefLabel(refs: GenericRef[], id: number, fallback: string = ''): string {
  const ref = findRefById(refs, id);
  return ref?.LABEL || fallback;
}

/**
 * Get ATA label by ID
 */
export function getAtaLabel(ataId: number): string {
  return getRefLabel(referentialStore.atas, ataId, `ATA-${ataId}`);
}

/**
 * Get Task Type label by ID
 */
export function getTaskTypeLabel(taskTypeId: number): string {
  return getRefLabel(referentialStore.taskTypes, taskTypeId, `Type-${taskTypeId}`);
}

// ============================================================================
// RESET (for testing/logout)
// ============================================================================

export function resetBootstrap(): void {
  referentialStore = { ...emptyStore };
  isBootstrapped = false;
  bootstrapPromise = null;
}

// Export accessors as a namespace
export const refs = {
  acTypes: getAcTypes,
  acFleet: getAcFleet,
  settings: getSettings,
  atas: getAtas,
  taskTypes: getTaskTypes,
  craTypes: getCraTypes,
  delays: getDelays,
  movUrgs: getMovUrgs,
  specialities: getSpecialities,
  pnTypes: getPnTypes,
  movTypes: getMovTypes,
  findById: findRefById,
  findByCode: findRefByCode,
  getLabel: getRefLabel,
  getAtaLabel,
  getTaskTypeLabel,
};

export default {
  bootstrap: bootstrapReferentials,
  isLoaded: isReferentialsLoaded,
  waitFor: waitForBootstrap,
  reset: resetBootstrap,
  refs,
};
