import type { WeatherProvider, WeatherQuery } from './weather-provider.interface.js';
import type {
  NormalizedWeather,
  NormalizedForecast,
  IntegrationHealth,
  ScenarioRecord,
  ScenarioInput
} from '../../types/index.js';
import { logger } from '../../utils/logger.js';
import { ScenarioModel } from '../../models/Scenario.model.js';
import { isDatabaseConnected } from '../../config/db.js';

export const PRECONFIGURED_SCENARIOS: ScenarioInput[] = [
  {
    id: 'SCENARIO-NORMAL',
    name: 'Normal Weather Conditions (Baseline Drill)',
    description: 'Dry to light seasonal showers, stable slope pore pressure, open highway corridors.',
    district: 'east_sikkim',
    state: 'Sikkim',
    rainfall24hMm: 12,
    forecastRainfall24hMm: 15,
    forecastRainfall72hMm: 35,
    soilMoisturePercent: 32,
    slopeDegrees: 28,
    historicalSusceptibility: 35,
    verifiedReportCount: 0,
    verifiedReportSeverity: 'NONE',
    roadStatus: 'OPEN',
    shelterOccupancyPercent: 15,
    durationMinutes: 30,
    operator: 'College Demo Controller'
  },
  {
    id: 'SCENARIO-HEAVY-RAIN',
    name: 'Heavy Rainfall Watch (Early Warning Drill)',
    description: 'Continuous monsoon downpour over 18 hours, saturating topsoil along highway shoulders.',
    district: 'east_khasi',
    state: 'Meghalaya',
    rainfall24hMm: 165,
    forecastRainfall24hMm: 80,
    forecastRainfall72hMm: 160,
    soilMoisturePercent: 78,
    slopeDegrees: 36,
    historicalSusceptibility: 70,
    verifiedReportCount: 2,
    verifiedReportSeverity: 'MODERATE',
    roadStatus: 'PARTIALLY_BLOCKED',
    shelterOccupancyPercent: 45,
    durationMinutes: 30,
    operator: 'College Demo Controller'
  },
  {
    id: 'SCENARIO-CRITICAL-LANDSLIDE',
    name: 'Critical Landslide Scenario (Coronation Bridge Drill)',
    description: 'Cloudburst triggered debris flow completely blocking NH-10 carriageway. High soil pore pressure.',
    district: 'east_sikkim',
    state: 'Sikkim',
    rainfall24hMm: 245,
    forecastRainfall24hMm: 95,
    forecastRainfall72hMm: 180,
    soilMoisturePercent: 96,
    slopeDegrees: 48,
    historicalSusceptibility: 90,
    verifiedReportCount: 5,
    verifiedReportSeverity: 'CRITICAL',
    roadStatus: 'CLOSED',
    shelterOccupancyPercent: 82,
    durationMinutes: 30,
    operator: 'College Demo Controller'
  },
  {
    id: 'SCENARIO-FLASH-FLOOD',
    name: 'Flash Flood Scenario (Haflong Hills Catchment Drill)',
    description: 'Sudden convective storm causing river torrents to wash over culverts and hill road embankments.',
    district: 'dima_hasao',
    state: 'Assam',
    rainfall24hMm: 210,
    forecastRainfall24hMm: 85,
    forecastRainfall72hMm: 175,
    soilMoisturePercent: 94,
    slopeDegrees: 42,
    historicalSusceptibility: 85,
    verifiedReportCount: 4,
    verifiedReportSeverity: 'CRITICAL',
    roadStatus: 'CLOSED',
    shelterOccupancyPercent: 75,
    durationMinutes: 30,
    operator: 'College Demo Controller'
  },
  {
    id: 'SCENARIO-CYCLONE',
    name: 'Cyclone / Severe Storm Scenario (Ridge Gale Drill)',
    description: 'High wind gusts coupled with intense rainfall mobilizing scree and undermining high-altitude passes.',
    district: 'west_kameng',
    state: 'Arunachal Pradesh',
    rainfall24hMm: 190,
    forecastRainfall24hMm: 110,
    forecastRainfall72hMm: 220,
    soilMoisturePercent: 88,
    slopeDegrees: 44,
    historicalSusceptibility: 80,
    verifiedReportCount: 3,
    verifiedReportSeverity: 'HIGH',
    roadStatus: 'CLOSED',
    shelterOccupancyPercent: 65,
    durationMinutes: 30,
    operator: 'College Demo Controller'
  }
];

export class ScenarioWeatherProvider implements WeatherProvider {
  // In-memory active scenario store
  private activeScenario: ScenarioRecord | null = null;
  private scenarioLibrary = new Map<string, ScenarioRecord>();
  private readonly initializedAt = new Date().toISOString();
  private lastActionAt: string | null = null;

  constructor() {
    // Initialize library with preconfigured scenarios
    const now = new Date();
    for (const preset of PRECONFIGURED_SCENARIOS) {
      this.scenarioLibrary.set(preset.id!, {
        ...preset,
        id: preset.id!,
        isActive: false,
        createdAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + preset.durationMinutes * 60000).toISOString()
      });
    }
  }

  private cleanExpiredScenario(): void {
    if (this.activeScenario) {
      const now = new Date();
      if (now.getTime() > new Date(this.activeScenario.expiresAt).getTime()) {
        logger.info(`[ScenarioProvider] Active scenario '${this.activeScenario.name}' has expired. Deactivating.`);
        this.activeScenario.isActive = false;
        this.scenarioLibrary.set(this.activeScenario.id, { ...this.activeScenario });

        if (isDatabaseConnected()) {
          ScenarioModel.updateOne({ id: this.activeScenario.id }, { isActive: false }).catch(() => {});
        }
        this.activeScenario = null;
      }
    }
  }

  getActiveScenario(): ScenarioRecord | null {
    this.cleanExpiredScenario();
    return this.activeScenario;
  }

  getAllScenarios(): ScenarioRecord[] {
    this.cleanExpiredScenario();
    return Array.from(this.scenarioLibrary.values());
  }

  async activateScenario(id: string, customDurationMinutes?: number, operator = 'Admin Controller'): Promise<ScenarioRecord> {
    const existing = this.scenarioLibrary.get(id);
    if (!existing) {
      throw new Error(`Scenario '${id}' not found in library.`);
    }

    // Deactivate any currently active scenario first
    if (this.activeScenario) {
      this.activeScenario.isActive = false;
      this.scenarioLibrary.set(this.activeScenario.id, { ...this.activeScenario });
    }

    const duration = customDurationMinutes || existing.durationMinutes || 30;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + duration * 60000).toISOString();

    const activated: ScenarioRecord = {
      ...existing,
      isActive: true,
      durationMinutes: duration,
      activatedAt: now.toISOString(),
      expiresAt,
      operator
    };

    this.activeScenario = activated;
    this.lastActionAt = now.toISOString();
    this.scenarioLibrary.set(id, activated);

    logger.info(`[ScenarioProvider] Activated scenario '${activated.name}' for district '${activated.district}' until ${expiresAt}`);

    if (isDatabaseConnected()) {
      ScenarioModel.findOneAndUpdate(
        { id },
        { ...activated },
        { upsert: true, new: true }
      ).catch((err: any) => logger.warn(`Failed persisting scenario in MongoDB: ${err.message}`));
    }

    return activated;
  }

  async deactivateScenario(id?: string): Promise<{ success: boolean; message: string }> {
    if (!this.activeScenario && !id) {
      return { success: true, message: 'No scenario was currently active.' };
    }

    const targetId = id || (this.activeScenario ? this.activeScenario.id : '');
    if (targetId && this.scenarioLibrary.has(targetId)) {
      const item = this.scenarioLibrary.get(targetId)!;
      item.isActive = false;
      this.scenarioLibrary.set(targetId, item);
      if (isDatabaseConnected()) {
        ScenarioModel.updateOne({ id: targetId }, { isActive: false }).catch(() => {});
      }
    }

    this.activeScenario = null;
    this.lastActionAt = new Date().toISOString();
    logger.info(`[ScenarioProvider] Scenario deactivated.`);
    return { success: true, message: 'Simulated scenario deactivated. Normal baseline restored.' };
  }

  async createCustomScenario(input: ScenarioInput): Promise<ScenarioRecord> {
    const id = input.id || `SCENARIO-CUSTOM-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date();
    const duration = input.durationMinutes || 30;

    const record: ScenarioRecord = {
      ...input,
      id,
      isActive: false,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + duration * 60000).toISOString()
    };

    this.scenarioLibrary.set(id, record);

    if (isDatabaseConnected()) {
      ScenarioModel.create(record).catch(() => {});
    }

    return record;
  }

  async getCurrentWeather(input: WeatherQuery): Promise<NormalizedWeather | NormalizedWeather[]> {
    this.cleanExpiredScenario();

    const nowIso = new Date().toISOString();
    const scenario = this.activeScenario;

    if (!scenario) {
      throw new Error('No scenario is currently active.');
    }

    const lat = scenario.latitude || (input.lat ?? 26.9012);
    const lng = scenario.longitude || (input.lng ?? 88.4715);

    let warningLevel: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' = 'GREEN';
    if (scenario.rainfall24hMm >= 200) warningLevel = 'RED';
    else if (scenario.rainfall24hMm >= 120) warningLevel = 'ORANGE';
    else if (scenario.rainfall24hMm >= 50) warningLevel = 'YELLOW';

    return {
      provider: 'SCENARIO',
      sourceType: 'SIMULATED_SCENARIO',
      isLive: false,
      isDemo: true,
      isOfficialWarning: false, // STRICTLY FALSE
      latitude: lat,
      longitude: lng,
      district: scenario.district,
      state: scenario.state || 'North East India',
      rainfall1hMm: Math.round((scenario.rainfall24hMm / 12) * 10) / 10,
      rainfall3hMm: Math.round((scenario.rainfall24hMm / 4) * 10) / 10,
      rainfall24hMm: scenario.rainfall24hMm,
      forecastRainfall24hMm: scenario.forecastRainfall24hMm,
      forecastRainfall72hMm: scenario.forecastRainfall72hMm || scenario.forecastRainfall24hMm * 2,
      warningLevel,
      warningType: `Simulated Scenario: ${scenario.name}`,
      warningText: `Scenario drill active: ${scenario.description || 'Pre-programmed simulation.'}`,
      observedAt: nowIso,
      fetchedAt: nowIso,
      validUntil: scenario.expiresAt,
      dataAgeMinutes: 0,
      dataFreshness: 'FRESH',
      disclaimer: 'Simulated scenario data for college demonstration only. Not an official weather warning.'
    };
  }

  async getForecast(input: WeatherQuery): Promise<NormalizedForecast> {
    const weather = await this.getCurrentWeather(input) as NormalizedWeather;
    const now = new Date();

    return {
      district: weather.district || 'Simulation Grid',
      state: weather.state || 'North East India',
      generatedAt: now.toISOString(),
      provider: 'SCENARIO',
      sourceType: 'SIMULATED_SCENARIO',
      periods: [
        {
          periodName: 'Scenario Simulation Window',
          validFrom: now.toISOString(),
          validTo: weather.validUntil || new Date(now.getTime() + 24 * 3600000).toISOString(),
          expectedRainfallMm: weather.forecastRainfall24hMm || 80,
          hazardProbabilityPct: 92,
          advisoryText: `Controlled simulation drill active: ${this.activeScenario?.name || 'Simulation'}`
        }
      ],
      disclaimer: 'Simulated scenario data for college demonstration only. Not an official weather forecast.',
      isDemo: true
    };
  }

  async getHealth(): Promise<IntegrationHealth> {
    this.cleanExpiredScenario();
    const isActive = Boolean(this.activeScenario);

    return {
      name: 'Scenario Weather Simulation Engine',
      configured: true,
      status: 'DEMO',
      isLive: false,
      lastSuccessfulFetch: null,
      lastAttemptAt: null,
      lastError: null,
      dataAgeMinutes: null,
      sourceType: 'DEMO',
      details: {
        initializedAt: this.initializedAt,
        activeScenarioId: this.activeScenario?.id || null,
        activeScenarioName: this.activeScenario?.name || null,
        active: isActive,
        lastActionAt: this.lastActionAt,
        preconfiguredScenarioCount: PRECONFIGURED_SCENARIOS.length
      },
      message: isActive
        ? `DEMO scenario active: '${this.activeScenario!.name}' (expires in ${Math.max(0, Math.round((new Date(this.activeScenario!.expiresAt).getTime() - Date.now()) / 60000))} min).`
        : `DEMO scenario engine idle. ${PRECONFIGURED_SCENARIOS.length} preconfigured college drill scenarios ready.`
    };
  }
}

export const scenarioWeatherProvider = new ScenarioWeatherProvider();
