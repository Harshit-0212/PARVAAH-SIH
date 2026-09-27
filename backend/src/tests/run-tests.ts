/**
 * Automated QA and Verification Suite for PARVAAH Backend API
 */

import assert from 'node:assert/strict';
import { app } from '../app.js';
import { riskService } from '../services/risk.service.js';
import { createReportSchema } from '../schemas/report.schema.js';
import { reportStorage } from '../providers/storage/report-storage.provider.js';
import { isValidCoordinates } from '../utils/geo.js';
import { ImdDemoProvider } from '../providers/weather/imd-demo.provider.js';
import { ImdLiveProvider } from '../providers/weather/imd-live.provider.js';
import http from 'node:http';

let passed = 0;
let failed = 0;

async function runTest(name: string, fn: () => Promise<void>) {
  try {
    process.stdout.write(`⏳ Running: ${name}... `);
    await fn();
    console.log(`✅ PASSED`);
    passed++;
  } catch (err: any) {
    console.log(`❌ FAILED`);
    console.error(`   Error: ${err.message}`);
    failed++;
  }
}

// Helper to make test HTTP requests against express app instance
function makeRequest(
  server: http.Server,
  path: string,
  options: { method?: string; body?: any; headers?: Record<string, string> } = {}
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: any }> {
  return new Promise((resolve, reject) => {
    const address = server.address() as any;
    const req = http.request(
      {
        host: '127.0.0.1',
        port: address.port,
        path,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(options.headers || {})
        }
      },
      (res) => {
        let raw = '';
        res.on('data', chunk => (raw += chunk));
        res.on('end', () => {
          let parsedBody: any;
          try {
            parsedBody = JSON.parse(raw);
          } catch {
            parsedBody = raw;
          }
          resolve({ status: res.statusCode || 0, headers: res.headers, body: parsedBody });
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function main() {
  console.log(`\n======================================================`);
  console.log(`🧪 STARTING PARVAAH BACKEND AUTOMATED TEST SUITE`);
  console.log(`======================================================\n`);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

  try {
    // Test 1: Health endpoint
    await runTest('1. GET /api/v1/health returns 200 with truthful status banner', async () => {
      const res = await makeRequest(server, '/api/v1/health');
      assert.equal(res.status, 200);
      assert.equal(res.body.ok, true);
      assert.ok(['research', 'demo', 'hybrid', 'live'].includes(res.body.dataMode));
      assert.ok(res.body.statusBanner.includes('WEATHER DATA') || res.body.statusBanner.includes('DEMO MODE'));
      assert.ok(res.headers['x-request-id']);
    });

    // Test 2: Integrations health in demo mode
    await runTest('2. GET /api/v1/integrations/health returns DEMO and NOT_CONFIGURED appropriately', async () => {
      const res = await makeRequest(server, '/api/v1/integrations/health');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      const imd = res.body.data.providers.find((p: any) => p.name.includes('IMD'));
      assert.ok(imd);
      assert.equal(imd.status, 'DEMO');
      assert.equal(imd.isLive, false);
      assert.ok(imd.message.includes('demo weather data is active'));
    });

    // Test 3: Incident list and query filtering
    await runTest('3. GET /api/v1/incidents returns list with demo flags and district filtering', async () => {
      const res = await makeRequest(server, '/api/v1/incidents?district=east_sikkim');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.isDemo, true);
      assert.equal(res.body.isLive, false);
      assert.ok(Array.isArray(res.body.data));
      assert.ok(res.body.data.length > 0);
      assert.equal(res.body.data[0].district, 'east_sikkim');
      assert.equal(res.body.data[0].isDemo, true);
    });

    // Test 4: Incident detail 404
    await runTest('4. GET /api/v1/incidents/NON_EXISTENT_ID returns 404 error with request ID', async () => {
      const res = await makeRequest(server, '/api/v1/incidents/INC-DOES-NOT-EXIST');
      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
      assert.ok(res.body.error.includes('not found'));
      assert.ok(res.body.requestId);
    });

    // Test 5: Weather demo provider
    await runTest('5. Weather demo provider returns normalized records with isDemo=true', async () => {
      const provider = new ImdDemoProvider();
      const weather = await provider.getCurrentWeather({ district: 'east_khasi' }) as any;
      assert.equal(weather.district, 'east_khasi');
      assert.equal(weather.isDemo, true);
      assert.equal(weather.isLive, false);
      assert.equal(weather.sourceType, 'IMD_DEMO');
      assert.equal(weather.isOfficialWarning, false);
    });

    // Test 6: IMD Live Provider returns NOT_CONFIGURED when credentials absent
    await runTest('6. IMD Live Provider returns safe diagnostic NOT_CONFIGURED without leaking secrets', async () => {
      const liveProvider = new ImdLiveProvider();
      const health = await liveProvider.getHealth();
      assert.equal(health.isLive, false);
      assert.ok(health.status === 'DEMO' || health.status === 'NOT_CONFIGURED');
    });

    // Test 7: Risk score calculation & boundary checks
    await runTest('7. Risk Engine computes rule-based score within 0-100 and classifies boundaries', async () => {
      // High hazard scenario
      const highRisk = riskService.calculateRisk({
        rainfall24hMm: 215,
        forecastRainfall24hMm: 70,
        soilMoisturePercent: 92,
        slopeDegrees: 44,
        historicalSusceptibility: 85,
        verifiedFieldReportSeverity: 'CRITICAL'
      });
      assert.ok(highRisk.riskScore >= 75);
      assert.equal(highRisk.riskLevel, 'CRITICAL');
      assert.equal(highRisk.modelMode, 'DEMO_RULE_BASED');
      assert.equal(highRisk.modelVersion, 'prototype-rule-based-v1');
      assert.ok(highRisk.disclaimer.includes('prototype decision-support advisory'));

      // Low hazard scenario
      const lowRisk = riskService.calculateRisk({
        rainfall24hMm: 10,
        forecastRainfall24hMm: 5,
        soilMoisturePercent: 20,
        slopeDegrees: 10,
        historicalSusceptibility: 15,
        verifiedFieldReportSeverity: 'NONE'
      });
      assert.ok(lowRisk.riskScore < 25);
      assert.equal(lowRisk.riskLevel, 'LOW');
    });

    // Test 8: Evacuation Safety Gate - Risk engine NEVER sets official evacuation status
    await runTest('8. Evacuation Safety Gate: Risk engine returns recommendations only, never mandatory official orders', async () => {
      const criticalRisk = riskService.calculateRisk({
        rainfall24hMm: 300,
        forecastRainfall24hMm: 120,
        soilMoisturePercent: 98,
        slopeDegrees: 55,
        historicalSusceptibility: 95,
        verifiedFieldReportSeverity: 'CRITICAL'
      });
      // It returns evacuationRecommendation
      assert.equal(criticalRisk.evacuationRecommendation, 'MANDATORY');
      // It does NOT have officialEvacuationStatus property (only administrative authorities can set that)
      assert.equal((criticalRisk as any).officialEvacuationStatus, undefined);
    });

    // Test 9: Coordinate validation
    await runTest('9. GIS Coordinate Validator rejects out-of-bounds coordinates safely', async () => {
      assert.equal(isValidCoordinates(26.90, 88.47), true);
      assert.equal(isValidCoordinates(91.5, 88.47), false); // Latitude > 90
      assert.equal(isValidCoordinates(26.90, 185.0), false); // Longitude > 180
      assert.equal(isValidCoordinates('invalid', 88.47), false);
    });

    // Test 10: Report Schema Validation & Deduplication
    await runTest('10. Citizen Report validation and clientReportId deduplication', async () => {
      const clientReportId = `test-client-id-${Date.now()}`;
      const payload = {
        clientReportId,
        hazardType: 'LANDSLIDE',
        description: 'Large boulder fall on highway shoulder near milestone 12',
        latitude: 26.9012,
        longitude: 88.4715,
        roadCondition: 'CLOSED',
        numberOfPeopleAffected: 5,
        captureTimestamp: new Date().toISOString()
      };

      // 1st submission
      const res1 = await makeRequest(server, '/api/v1/reports', {
        method: 'POST',
        body: payload
      });
      assert.equal(res1.status, 201);
      assert.equal(res1.body.success, true);
      assert.equal(res1.body.isDuplicate, false);
      assert.equal(res1.body.status, 'UNDER_VERIFICATION');

      // 2nd submission with same clientReportId (simulating offline reconnect retry)
      const res2 = await makeRequest(server, '/api/v1/reports', {
        method: 'POST',
        body: payload
      });
      assert.equal(res2.status, 200);
      assert.equal(res2.body.isDuplicate, true);
      assert.equal(res2.body.clientReportId, clientReportId);
    });

    // Test 11: GET /api/v1/scenarios returns preset scenarios
    await runTest('11. GET /api/v1/scenarios returns all 5 preconfigured college drill scenarios', async () => {
      const res = await makeRequest(server, '/api/v1/scenarios');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      assert.ok(res.body.data.length >= 5);
      const normal = res.body.data.find((s: any) => s.id === 'SCENARIO-NORMAL');
      const critical = res.body.data.find((s: any) => s.id === 'SCENARIO-CRITICAL-LANDSLIDE');
      assert.ok(normal, 'Normal drill scenario exists');
      assert.ok(critical, 'Critical landslide drill scenario exists');
    });

    // Test 12: Scenario Activation and Weather/Risk Override
    await runTest('12. Scenario activation dynamically recalculates weather and elevates risk zones', async () => {
      // 1. Activate critical landslide drill
      const activateRes = await makeRequest(server, '/api/v1/scenarios/SCENARIO-CRITICAL-LANDSLIDE/activate', {
        method: 'POST',
        body: { durationMinutes: 15, operator: 'QA Test Runner' }
      });
      assert.equal(activateRes.status, 200);
      assert.equal(activateRes.body.success, true);
      assert.equal(activateRes.body.data.isActive, true);

      // 2. Fetch weather - verify provider is SCENARIO and isOfficialWarning is FALSE
      const weatherRes = await makeRequest(server, '/api/v1/weather?district=east_sikkim');
      assert.equal(weatherRes.status, 200);
      assert.equal(weatherRes.body.provider, 'SCENARIO');
      assert.equal(weatherRes.body.sourceType, 'SIMULATED_SCENARIO');
      assert.equal(weatherRes.body.isOfficialWarning, false);
      assert.equal(weatherRes.body.isDemo, true);

      // 3. Fetch risk zones - verify zone in Sikkim has elevated score from scenario
      const riskRes = await makeRequest(server, '/api/v1/risk-zones');
      assert.equal(riskRes.status, 200);
      assert.ok(riskRes.body.metadata.activeScenario);
      assert.equal(riskRes.body.metadata.activeScenario.id, 'SCENARIO-CRITICAL-LANDSLIDE');
      assert.equal(riskRes.body.metadata.dataSource, 'SIMULATED_SCENARIO');

      const skmZone = riskRes.body.features.find((f: any) => f.properties.zoneId.includes('SKM'));
      assert.ok(skmZone);
      assert.equal(skmZone.properties.modelMode, 'SIMULATED_SCENARIO');
      assert.ok(skmZone.properties.riskScore >= 75);
      assert.equal(skmZone.properties.riskLevel, 'CRITICAL');

      // 4. Deactivate scenario
      const deactivateRes = await makeRequest(server, '/api/v1/scenarios/SCENARIO-CRITICAL-LANDSLIDE/deactivate', {
        method: 'POST'
      });
      assert.equal(deactivateRes.status, 200);
      assert.equal(deactivateRes.body.success, true);

      // 5. Verify risk zones revert back to baseline
      const revertRes = await makeRequest(server, '/api/v1/risk-zones');
      assert.equal(revertRes.body.metadata.activeScenario, null);
    });

    // Test 13: Safety Enforcement - Open-Meteo & Research data NEVER labeled as official
    await runTest('13. Multi-Provider Safety Gate: Open-Meteo & Scenarios strictly enforce isOfficialWarning = false', async () => {
      // Direct weather check
      const res = await makeRequest(server, '/api/v1/weather');
      assert.equal(res.status, 200);
      assert.equal(res.body.isOfficialWarning, false);
      assert.ok(res.body.disclaimer);
      assert.ok(!res.body.disclaimer.includes('Official IMD Warning'));
    });

    // Test 14: XGBoost ML Inference integration via POST /api/v1/risk/calculate
    await runTest('14. XGBoost ML Integration: POST /api/v1/risk/calculate returns PRACTICE_XGBOOST with exact metadata', async () => {
      const res = await makeRequest(server, '/api/v1/risk/calculate', {
        method: 'POST',
        body: {
          rainfall_24h_mm: 115.0,
          forecast_rainfall_24h_mm: 128.0,
          soil_moisture_percent: 93.0,
          slope_degrees: 45.0,
          historical_landslide_density: 0.88,
          verified_report_count: 9,
          zoneId: 'ZONE-SKM-01'
        }
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      const data = res.body.data;
      assert.equal(data.modelVersion, 'practice-xgboost-v1');
      assert.equal(data.modelMode, 'PRACTICE_XGBOOST');
      assert.equal(data.modelAvailable, true);
      assert.ok(data.landslideProbability > 0.8);
      assert.ok(data.riskScore >= 75);
      assert.equal(data.riskLevel, 'CRITICAL');
      assert.ok(data.calculatedAt);
      assert.ok(data.disclaimer.includes('Practice-only synthetic model'));
      assert.equal(data.evacuationRecommendation, 'MANDATORY');
      // Safety gate: never issue official evacuation order
      assert.equal((data as any).officialEvacuationStatus, undefined);
    });

    // Test 15: Zone Recalculation via POST /api/v1/risk-zones/:id/recalculate
    await runTest('15. Automatic Zone Recalculation: POST /api/v1/risk-zones/:id/recalculate updates risk and GeoJSON', async () => {
      const res = await makeRequest(server, '/api/v1/risk-zones/ZONE-SKM-01/recalculate', {
        method: 'POST',
        body: { triggerSource: 'TEST_TRIGGER' }
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.id, 'ZONE-SKM-01');
      assert.ok(res.body.data.properties.riskScore !== undefined);
      assert.ok(res.body.data.properties.riskLevel !== undefined);
      assert.ok(res.body.data.properties.disclaimer.includes('Practice-only') || res.body.data.properties.disclaimer.includes('prototype'));
    });

    // Test 16: Clear State via POST /api/v1/scenarios/clear-state
    await runTest('16. Clear State Safeguard: POST /api/v1/scenarios/clear-state clears overrides while preserving stored reports', async () => {
      const res = await makeRequest(server, '/api/v1/scenarios/clear-state', {
        method: 'POST'
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.action, 'CLEAR_DEMO_STATE');
      assert.equal(res.body.preservationStatus.storedReportsPreserved, true);
      assert.equal(res.body.preservationStatus.officialRecordsPreserved, true);
    });

    // Test 17: Operational Telemetry via GET /api/v1/telemetry
    await runTest('17. Operational Telemetry: GET /api/v1/telemetry exposes full system and ML health metrics', async () => {
      const res = await makeRequest(server, '/api/v1/telemetry');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      const data = res.body.data;
      assert.equal(data.apiHealth.status, 'UP');
      assert.ok(['CONNECTED', 'DISCONNECTED', 'NOT_CONFIGURED'].includes(data.database.status));
      assert.equal(data.fastApiMl.isAvailable, true);
      assert.equal(data.fastApiMl.modelLoaded, true);
      assert.equal(data.fastApiMl.modelMode, 'PRACTICE_XGBOOST');
      assert.ok(data.operationalTimestamps.lastRiskRecalculation);
    });

  } finally {
    server.close();
  }

  console.log(`\n======================================================`);
  console.log(`🏁 TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
