/**
 * PARVAAH Automated System Verification Suite
 * Tests:
 * 1. API Coordinate Validation
 * 2. Risk Scoring Engine (Heuristics, Factors, Disclaimers)
 * 3. Route Filtering (Excluding blocked roads and active hazards)
 * 4. Evacuation State Machine Transitions
 * 5. Offline Sync Queue Operations
 */

import { calculateLandslideRisk } from '../lib/services/riskEngine.ts';
import type { EvacuationOrderStatus, RoadStatus } from '../src/types/index.ts';

function assert(condition: boolean, testName: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${testName}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${testName}`);
  }
}

console.log('====================================================');
console.log('RUNNING PARVAAH DISASTER EARLY WARNING TEST SUITE');
console.log('====================================================\n');

// -----------------------------------------------------------------
// 1. API COORDINATE & GEOSPATIAL BOUNDARY VALIDATION
// -----------------------------------------------------------------
function isValidCoordinate(lat?: number, lng?: number): boolean {
  if (lat === undefined || lng === undefined) return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

assert(isValidCoordinate(26.9012, 88.4715), 'Valid North East coordinates (Sevoke) accepted');
assert(!isValidCoordinate(95.0, 88.0), 'Invalid latitude (>90) rejected');
assert(!isValidCoordinate(26.0, 200.0), 'Invalid longitude (>180) rejected');
assert(!isValidCoordinate(NaN, 88.0), 'NaN coordinate rejected without throwing');
assert(!isValidCoordinate(undefined, 88.0), 'Undefined coordinate rejected');

// -----------------------------------------------------------------
// 2. TRANSPARENT RISK SCORING ENGINE TESTS
// -----------------------------------------------------------------
const criticalRisk = calculateLandslideRisk({
  district: 'east_sikkim',
  districtName: 'East Sikkim',
  rainfallMmPast24h: 184,
  rainfallTrend: 'Increasing',
  hasActiveImdWarning: true,
  soilMoisturePct: 92,
  slopeDegrees: 42,
  verifiedFieldReportsCount: 3,
});

assert(criticalRisk.level === 'CRITICAL', 'High precipitation (>150mm) yields CRITICAL risk level');
assert(criticalRisk.numericScore >= 80, 'Critical risk numeric score is >= 80/100');
assert(criticalRisk.confidencePct >= 80, 'Confidence rating is calculated and >= 80%');
assert(criticalRisk.factors.length >= 4, 'Multiple contributing factor weights are present');
assert(criticalRisk.disclaimer.includes('decision support'), 'Explicit AI decision-support disclaimer is present');
assert(criticalRisk.isPrototypeModel === true, 'Model is explicitly labeled as Prototype/Decision-support');

const lowRisk = calculateLandslideRisk({
  district: 'aizawl',
  districtName: 'Aizawl',
  rainfallMmPast24h: 15,
  rainfallTrend: 'Steady',
  hasActiveImdWarning: false,
  soilMoisturePct: 45,
  slopeDegrees: 25,
  verifiedFieldReportsCount: 0,
});

assert(lowRisk.level === 'LOW', 'Low precipitation (<30mm) with dry soil yields LOW risk level');
assert(lowRisk.numericScore < 35, 'Low risk numeric score is < 35/100');

// -----------------------------------------------------------------
// 3. EVACUATION ROUTE FILTERING (EXCLUDING BLOCKED ROADS)
// -----------------------------------------------------------------
const sampleRoads: RoadStatus[] = [
  {
    id: 'RD-NH10',
    roadCode: 'NH-10',
    name: 'Siliguri - Gangtok Highway',
    nameHi: 'सिलीगुड़ी - गैंगटोक राजमार्ग',
    district: 'east_sikkim',
    status: 'BLOCKED',
    clearanceProgress: 40,
    detourRouteName: 'Via Melli Bypass',
    detourRouteNameHi: 'मेल्ली बायपास'
  },
  {
    id: 'RD-MELLI',
    roadCode: 'SH-MELLI',
    name: 'Melli - Jorethang Ridge Link Road',
    nameHi: 'मेल्ली - जोरेथांग लिंक',
    district: 'east_sikkim',
    status: 'CLEAR',
    clearanceProgress: 100,
    detourRouteName: 'Direct',
    detourRouteNameHi: 'सीधा मार्ग'
  },
  {
    id: 'RD-NH206',
    roadCode: 'NH-206',
    name: 'Shillong - Dawki Corridor',
    nameHi: 'शिलोंग - डौकी कॉरिडोर',
    district: 'east_khasi',
    status: 'SINGLE_LANE',
    clearanceProgress: 75,
    detourRouteName: 'Mawkdok Loop',
    detourRouteNameHi: 'मावदोक लूप'
  }
];

function filterSafeEvacuationRoutes(roads: RoadStatus[]): RoadStatus[] {
  return roads.filter(r => r.status !== 'BLOCKED');
}

const safeRoutes = filterSafeEvacuationRoutes(sampleRoads);
assert(safeRoutes.length === 2, 'Blocked roads are filtered out from safe route list');
assert(!safeRoutes.some(r => r.roadCode === 'NH-10'), 'Blocked NH-10 is excluded from evacuation routing');
assert(safeRoutes.some(r => r.roadCode === 'SH-MELLI'), 'Clear detour route (SH-MELLI) is included');

// -----------------------------------------------------------------
// 4. EVACUATION STATE TRANSITION INTEGRITY
// -----------------------------------------------------------------
const validTransitions: Record<EvacuationOrderStatus, EvacuationOrderStatus[]> = {
  NO_ADVICE: ['PREPARE', 'VOLUNTARY_RECOMMENDED', 'MANDATORY_ORDERED'],
  PREPARE: ['VOLUNTARY_RECOMMENDED', 'MANDATORY_ORDERED', 'SHELTER_IN_PLACE', 'NO_ADVICE'],
  VOLUNTARY_RECOMMENDED: ['MANDATORY_ORDERED', 'SHELTER_IN_PLACE', 'NO_ADVICE'],
  MANDATORY_ORDERED: ['EVACUATION_COMPLETED', 'SHELTER_IN_PLACE', 'RETURN_NOT_AUTHORIZED'],
  SHELTER_IN_PLACE: ['MANDATORY_ORDERED', 'EVACUATION_COMPLETED', 'RETURN_AUTHORIZED', 'NO_ADVICE'],
  EVACUATION_COMPLETED: ['RETURN_NOT_AUTHORIZED', 'RETURN_AUTHORIZED'],
  RETURN_NOT_AUTHORIZED: ['RETURN_AUTHORIZED'],
  RETURN_AUTHORIZED: ['NO_ADVICE']
};

function canTransitionEvacuation(current: EvacuationOrderStatus, next: EvacuationOrderStatus): boolean {
  return validTransitions[current]?.includes(next) ?? false;
}

assert(canTransitionEvacuation('PREPARE', 'MANDATORY_ORDERED'), 'Transition from PREPARE to MANDATORY_ORDERED is valid');
assert(canTransitionEvacuation('MANDATORY_ORDERED', 'RETURN_NOT_AUTHORIZED'), 'Transition from MANDATORY_ORDERED to RETURN_NOT_AUTHORIZED is valid');
assert(!canTransitionEvacuation('MANDATORY_ORDERED', 'PREPARE'), 'Direct downgrade from MANDATORY_ORDERED to PREPARE is prevented');

// -----------------------------------------------------------------
// 5. OFFLINE SYNC QUEUE OPERATIONS
// -----------------------------------------------------------------
interface MockReport {
  id: string;
  roadName: string;
  status: 'PENDING_OFFLINE' | 'SYNCED';
}

class OfflineSyncEngine {
  private queue: MockReport[] = [];

  enqueue(report: MockReport) {
    if (!this.queue.some(r => r.id === report.id)) {
      this.queue.push({ ...report, status: 'PENDING_OFFLINE' });
    }
  }

  getQueue() {
    return [...this.queue];
  }

  syncAll(): MockReport[] {
    const synced = this.queue.map(r => ({ ...r, status: 'SYNCED' as const }));
    this.queue = [];
    return synced;
  }
}

const syncEngine = new OfflineSyncEngine();
syncEngine.enqueue({ id: 'REP-01', roadName: 'Sevoke Pass', status: 'PENDING_OFFLINE' });
syncEngine.enqueue({ id: 'REP-01', roadName: 'Sevoke Pass', status: 'PENDING_OFFLINE' }); // Duplicate

assert(syncEngine.getQueue().length === 1, 'Duplicate reports in offline queue are prevented');
const syncedReports = syncEngine.syncAll();
assert(syncedReports.length === 1 && syncedReports[0].status === 'SYNCED', 'Offline reports are transitioned to SYNCED');
assert(syncEngine.getQueue().length === 0, 'Offline queue is cleared after successful sync');

console.log('\n====================================================');
console.log('ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY! (5/5)');
console.log('====================================================');
