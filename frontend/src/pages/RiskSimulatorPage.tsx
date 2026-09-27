import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { Activity, Calculator, Database, Info, RotateCcw, Save, Zap } from 'lucide-react';
import {
  calculateRisk,
  calculateXGBoostRisk,
  fetchRiskZones,
  type RiskCalculationResult,
  type DemoXGBoostResult,
} from '../api/risk';
import { createScenario } from '../api/scenarios';
import type { RiskZoneFeature, RiskZoneFeatureCollection } from '../types';

type ZoneKey = 'east_sikkim' | 'east_khasi' | 'dima_hasao';

const zones: Record<ZoneKey, { label: string; match: string }> = {
  east_sikkim: { label: 'East Sikkim', match: 'sikkim' },
  east_khasi: { label: 'East Khasi Hills', match: 'khasi' },
  dima_hasao: { label: 'Dima Hasao', match: 'hasao' },
};

// Zone-specific terrain values — use raw density matching training data scale
const terrainByZone: Record<ZoneKey, { slope: number; density: number; elevation: number }> = {
  east_sikkim: { slope: 45, density: 36.2, elevation: 1450 },
  east_khasi:  { slope: 36, density: 18.5, elevation: 1200 },
  dima_hasao:  { slope: 42, density: 28.7, elevation: 980 },
};

const defaultValues = {
  rainfall_24h_mm: 45,
  rainfall_48h_mm: 92,
  rainfall_7d_mm: 320,
  soil_moisture_percent: 45,
  slope_degrees: 45,        // updated by zone
  elevation_m: 1450,        // updated by zone
  historical_landslide_density: 36.2, // raw 0–83 scale (updated by zone)
};

const lowRisk = {
  ...defaultValues,
  rainfall_24h_mm: 8,
  rainfall_48h_mm: 14,
  rainfall_7d_mm: 55,
  soil_moisture_percent: 42,
  slope_degrees: 18,
  historical_landslide_density: 0.1,
};

const criticalRisk = {
  ...defaultValues,
  rainfall_24h_mm: 145,
  rainfall_48h_mm: 290,
  rainfall_7d_mm: 765,
  soil_moisture_percent: 52,
  slope_degrees: 48,
  historical_landslide_density: 50.0,
};

// Consistent, authoritative risk level from score — used for ALL display
export function getRiskLevelFromScore(score: number): 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' {
  if (score >= 75) return 'CRITICAL';
  if (score >= 50) return 'HIGH';
  if (score >= 25) return 'MODERATE';
  return 'LOW';
}

const RISK_COLORS: Record<string, string> = {
  CRITICAL: '#DC2626',
  HIGH: '#EA580C',
  MODERATE: '#D97706',
  LOW: '#059669',
};

type ActiveResult =
  | { type: 'xgboost'; data: DemoXGBoostResult }
  | { type: 'rule'; data: RiskCalculationResult }
  | null;

export function RiskSimulatorPage() {
  const [zoneKey, setZoneKey] = useState<ZoneKey>('east_sikkim');
  const [zoneData, setZoneData] = useState<RiskZoneFeatureCollection | null>(null);
  const [values, setValues] = useState(defaultValues);
  const [activeResult, setActiveResult] = useState<ActiveResult>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchRiskZones()
      .then(setZoneData)
      .catch(() => setMessage('Risk zone geometry unavailable. Calculations still work.'));
  }, []);

  // Update terrain fields when zone changes
  useEffect(() => {
    const t = terrainByZone[zoneKey];
    setValues((cur) => ({
      ...cur,
      slope_degrees: t.slope,
      elevation_m: t.elevation,
      historical_landslide_density: t.density,
    }));
  }, [zoneKey]);

  const selectedFeature = useMemo<RiskZoneFeature | undefined>(() => {
    if (!zoneData?.features) return undefined;
    return zoneData.features.find((f) => {
      const title = String(f.properties?.title ?? '');
      return title.toLowerCase().includes(zones[zoneKey].match);
    });
  }, [zoneData, zoneKey]);

  function updateValue(key: keyof typeof values, raw: string) {
    const num = Number(raw);
    setValues((cur) => ({ ...cur, [key]: num }));
  }

  // ── Calculate XGBoost Risk (7-feature demo_xgboost_v1) ──────────────────
  async function runXGBoostCalculation() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await calculateXGBoostRisk({
        rainfall_24h_mm: values.rainfall_24h_mm,
        rainfall_48h_mm: values.rainfall_48h_mm,
        rainfall_7d_mm: values.rainfall_7d_mm,
        soil_moisture_percent: values.soil_moisture_percent,
        slope_degrees: values.slope_degrees,
        elevation_m: values.elevation_m,
        historical_landslide_density: values.historical_landslide_density,
        zoneId: selectedFeature?.properties.zoneId,
        triggeredBy: 'RISK_SIMULATOR',
      });
      setActiveResult({ type: 'xgboost', data: res.data });
      if (res.data.isFallback) {
        setMessage('FastAPI unavailable — DEMO_RULE_BASED fallback used.');
      } else {
        setMessage(`XGBoost inference complete · model: ${res.data.modelVersion}`);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'XGBoost calculation failed.');
    } finally {
      setBusy(false);
    }
  }

  // ── Rule-based fallback (legacy 6-feature) ──────────────────────────────
  async function runRuleBasedCalculation() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await calculateRisk({
        rainfall_24h_mm: values.rainfall_24h_mm,
        forecast_rainfall_24h_mm: values.rainfall_24h_mm * 1.1, // approximate
        soil_moisture_percent: values.soil_moisture_percent,
        slope_degrees: values.slope_degrees,
        historical_landslide_density: values.historical_landslide_density,
        verified_report_count: 0,
        zoneId: selectedFeature?.properties.zoneId,
        triggeredBy: 'RISK_SIMULATOR',
      });
      setActiveResult({ type: 'rule', data: res.data });
      if (res.data.isFallback) {
        setMessage('FastAPI unavailable — DEMO_RULE_BASED fallback used.');
      } else {
        setMessage(`Inference complete · model: ${res.data.modelMode}`);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Risk calculation failed.');
    } finally {
      setBusy(false);
    }
  }

  async function saveScenario() {
    setBusy(true);
    try {
      await createScenario({
        name: `Risk Simulator – ${zones[zoneKey].label}`,
        description: 'Academic simulation preset.',
        district: zoneKey,
        state: 'North East India',
        rainfall24hMm: values.rainfall_24h_mm,
        forecastRainfall24hMm: values.rainfall_48h_mm / 2,
        soilMoisturePercent: values.soil_moisture_percent,
        slopeDegrees: values.slope_degrees,
        durationMinutes: 30,
        operator: 'Risk Simulator',
      });
      setMessage('Scenario saved — clearly labelled as a college demonstration.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Scenario could not be saved.');
    } finally {
      setBusy(false);
    }
  }

  // ── Derived display values ───────────────────────────────────────────────
  const resultScore = activeResult
    ? activeResult.data.riskScore
    : null;

  const displayRiskLevel = resultScore !== null ? getRiskLevelFromScore(resultScore) : null;
  const color = displayRiskLevel ? RISK_COLORS[displayRiskLevel] : '#6B7280';

  const displayProb = activeResult ? activeResult.data.landslideProbability : null;
  const displayModelMode = activeResult ? activeResult.data.modelMode : null;
  const displayModelVersion = activeResult ? activeResult.data.modelVersion : null;
  const displayLatency = activeResult ? activeResult.data.latencyMs : null;
  const displayIsFallback = activeResult ? activeResult.data.isFallback : false;
  const displayCalculatedAt = activeResult ? activeResult.data.calculatedAt : null;

  // AI recommendation from model — NOT an official order
  const aiEvacRecommendation =
    activeResult?.type === 'xgboost'
      ? activeResult.data.evacuationRecommendation
      : resultScore !== null
      ? resultScore >= 50 ? 'PREPARE_TO_EVACUATE' : 'NO_ADVICE'
      : 'NO_ADVICE';

  // Official status is ALWAYS NO_ADVICE from the simulator
  const officialEvacStatus =
    activeResult?.type === 'xgboost'
      ? activeResult.data.officialEvacuationStatus
      : 'NO_ADVICE';

  // Contributing factors (only for rule-based result)
  const factors =
    activeResult?.type === 'rule' && activeResult.data.contributingFactors
      ? Object.entries(activeResult.data.contributingFactors)
      : null;

  // Input field config — note: historical_landslide_density is raw 0–83 (not 0–1)
  const inputFields: Array<[keyof typeof values, string, string, boolean]> = [
    ['rainfall_24h_mm',            'Rainfall past 24 h (mm)',                         'DEMO / MANUAL',       false],
    ['rainfall_48h_mm',            'Rainfall past 48 h (mm)',                         'DEMO / MANUAL',       false],
    ['rainfall_7d_mm',             'Rainfall past 7 days (mm)',                       'DEMO / MANUAL',       false],
    ['soil_moisture_percent',      'Soil moisture (%, range 13–52 in training data)',  'DEMO / MANUAL',       false],
    ['slope_degrees',              'Slope (degrees)',                                  'FIXED TERRAIN DATA',  true],
    ['elevation_m',                'Elevation above sea level (m)',                    'FIXED TERRAIN DATA',  true],
    ['historical_landslide_density','Historical density (raw 0–83 scale)',             'FIXED TERRAIN DATA', true],
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Academic decision-support tool</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">Risk Simulator</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Run the <strong>demo_xgboost_v1</strong> model (trained on 561 positive + 561 negative balanced events)
          against seven manually adjusted inputs. This output is a decision-support simulation,
          not an official evacuation order.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        {/* ── Input Panel ── */}
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold text-slate-900">Inputs</h2>
            <select
              id="zone-selector"
              value={zoneKey}
              onChange={(e) => setZoneKey(e.target.value as ZoneKey)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {(Object.keys(zones) as ZoneKey[]).map((k) => (
                <option key={k} value={k}>{zones[k].label}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {inputFields.map(([key, label, source, readOnly]) => (
              <label key={key} className="text-xs font-semibold text-slate-700">
                {label}
                <input
                  id={`input-${key}`}
                  type="number"
                  min="0"
                  step="any"
                  value={values[key]}
                  readOnly={readOnly}
                  onChange={(e) => updateValue(key, e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm read-only:bg-slate-100"
                />
                <span className="mt-1 inline-flex rounded bg-slate-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                  {source}
                </span>
              </label>
            ))}
          </div>

          {/* Presets */}
          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <button
              id="btn-load-low"
              onClick={() => setValues(lowRisk)}
              className="rounded-md border border-emerald-600 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50"
            >
              Load Low-Risk Example
            </button>
            <button
              id="btn-load-critical"
              onClick={() => setValues(criticalRisk)}
              className="rounded-md border border-red-600 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
            >
              Load Critical-Risk Example
            </button>
            <button
              id="btn-reset"
              onClick={() => setValues(defaultValues)}
              title="Reset inputs"
              className="rounded-md border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              id="btn-calculate-xgboost"
              disabled={busy}
              onClick={runXGBoostCalculation}
              className="inline-flex items-center gap-2 rounded-md bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-50"
            >
              <Zap className="h-4 w-4" />
              Calculate XGBoost Risk
            </button>
            <button
              id="btn-calculate-rule"
              disabled={busy}
              onClick={runRuleBasedCalculation}
              className="inline-flex items-center gap-2 rounded-md border border-slate-400 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <Calculator className="h-4 w-4" />
              Rule-Based Fallback
            </button>
            <button
              id="btn-save-scenario"
              disabled={busy}
              onClick={saveScenario}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Save as Demo Scenario
            </button>
          </div>

          {message && (
            <p className="rounded-md bg-slate-50 p-3 text-xs text-slate-700">{message}</p>
          )}
        </section>

        {/* ── Result Panel ── */}
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 font-bold text-slate-900">
            <Activity className="h-4 w-4 text-teal-700" />
            Result
          </h2>

          {activeResult ? (
            <div className="space-y-4">
              {/* Score Ring */}
              <div className="flex items-center gap-5">
                <div
                  id="risk-score-ring"
                  className="flex h-28 w-28 flex-shrink-0 items-center justify-center rounded-full border-[10px] text-2xl font-black"
                  style={{ borderColor: color, color }}
                >
                  {Math.round(resultScore!)}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Risk level</p>
                  <p id="risk-level-display" className="text-2xl font-black" style={{ color }}>
                    {displayRiskLevel}
                  </p>
                  <p className="text-xs text-slate-500">
                    {displayIsFallback ? 'Rule-derived probability: ' : 'Probability: '}
                    <span id="risk-probability">{displayProb?.toFixed(3)}</span>
                    {' · '}
                    <span id="risk-latency">{displayLatency} ms</span>
                  </p>
                </div>
              </div>

              {/* Metadata Matrix */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded bg-slate-100 p-2">
                  <span className="font-semibold text-slate-600">Model mode:</span>{' '}
                  <span id="model-mode" className="font-bold text-slate-900">{displayModelMode}</span>
                </div>
                <div className="rounded bg-slate-100 p-2">
                  <span className="font-semibold text-slate-600">Model version:</span>{' '}
                  <span id="model-version" className="font-bold text-slate-900">{displayModelVersion}</span>
                </div>
                <div className="rounded bg-amber-50 border border-amber-200 p-2">
                  <span className="font-semibold text-amber-700">AI evac recommendation:</span>{' '}
                  <span id="ai-evac-recommendation" className="font-bold text-amber-900">{aiEvacRecommendation}</span>
                </div>
                <div className="rounded bg-blue-50 border border-blue-200 p-2">
                  <span className="font-semibold text-blue-700">Official evac status:</span>{' '}
                  <span id="official-evac-status" className="font-bold text-blue-900">{officialEvacStatus}</span>
                </div>
                <div className="col-span-2 rounded bg-slate-100 p-2 text-slate-600">
                  <span>Calculated at: {displayCalculatedAt ? new Date(displayCalculatedAt).toLocaleString() : '—'}</span>
                </div>
              </div>

              {/* Factor Breakdown — only for rule-based */}
              {factors && (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Contributing factors:</p>
                  <div className="space-y-1.5">
                    {factors.map(([name, factor]) => {
                      const f = factor as { value?: number; normalized: number; contribution: number };
                      return (
                        <div key={name}>
                          <div className="flex justify-between text-xs text-slate-600">
                            <span>{name}</span>
                            <span>{f.contribution} pts</span>
                          </div>
                          <div className="h-2 rounded bg-slate-100">
                            <div
                              className="h-2 rounded bg-teal-600"
                              style={{ width: `${Math.min(100, Math.max(0, f.normalized))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Input Summary for XGBoost */}
              {activeResult.type === 'xgboost' && (
                <div className="space-y-1 border-t border-slate-100 pt-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Inputs sent to model:</p>
                  <div className="grid grid-cols-2 gap-1 text-xs text-slate-600">
                    {Object.entries(activeResult.data.inputSummary).map(([k, v]) =>
                      typeof v === 'number' ? (
                        <div key={k} className="rounded bg-slate-50 px-2 py-1">
                          <span className="font-medium">{k}:</span> {v}
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <Info className="mr-1 inline h-3.5 w-3.5" />
                Decision-support simulation only. Not an official evacuation order.
                AI recommendation ≠ official status. Research/demo output only.
              </p>
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-slate-500">
              Click <strong>Calculate XGBoost Risk</strong> to run the demo model.
            </p>
          )}
        </section>
      </div>

      {/* Map */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-200 p-4 font-bold text-slate-900">
          <Database className="h-4 w-4 text-teal-700" />
          Selected zone preview
        </div>
        <div className="h-72">
          <MapContainer center={[25.9, 91.8]} zoom={6} scrollWheelZoom={false} className="h-full w-full">
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {selectedFeature && (
              <GeoJSON
                key={`${selectedFeature.id}-${resultScore ?? 'base'}`}
                data={selectedFeature as any}
                style={{ color, fillColor: color, fillOpacity: 0.35, weight: 3 }}
              />
            )}
          </MapContainer>
        </div>
      </section>
    </div>
  );
}