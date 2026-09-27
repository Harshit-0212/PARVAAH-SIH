import type { WeatherProvider, WeatherQuery } from '../providers/weather/weather-provider.interface.js';
import { ImdDemoProvider } from '../providers/weather/imd-demo.provider.js';
import { ImdLiveProvider } from '../providers/weather/imd-live.provider.js';
import { OpenMeteoProvider } from '../providers/weather/open-meteo.provider.js';
import { scenarioWeatherProvider, ScenarioWeatherProvider } from '../providers/weather/scenario-weather.provider.js';
import type { NormalizedWeather, NormalizedForecast, IntegrationHealth } from '../types/index.js';
import { env } from '../config/env.js';

export class WeatherService {
  private demoProvider: WeatherProvider = new ImdDemoProvider();
  private liveProvider: WeatherProvider = new ImdLiveProvider();
  private openMeteoProvider: OpenMeteoProvider = new OpenMeteoProvider();
  private scenarioProvider: ScenarioWeatherProvider = scenarioWeatherProvider;

  getActiveProvider(query?: WeatherQuery): WeatherProvider {
    // 1. If a scenario is currently active, it overrides weather for that scenario's district
    const activeScenario = this.scenarioProvider.getActiveScenario();
    if (activeScenario) {
      if (!query?.district || query.district === 'all' || query.district.toLowerCase() === activeScenario.district.toLowerCase()) {
        return this.scenarioProvider;
      }
    }

    // 2. Route based on configured DATA_MODE
    switch (env.DATA_MODE) {
      case 'research':
      case 'hybrid':
        return this.openMeteoProvider;
      case 'live':
        return env.IMD_ENABLED ? this.liveProvider : this.demoProvider;
      case 'demo':
      default:
        return this.demoProvider;
    }
  }

  async getCurrentWeather(query: WeatherQuery): Promise<NormalizedWeather | NormalizedWeather[]> {
    const provider = this.getActiveProvider(query);
    return provider.getCurrentWeather(query);
  }

  async getForecast(query: WeatherQuery): Promise<NormalizedForecast> {
    const provider = this.getActiveProvider(query);
    return provider.getForecast(query);
  }

  async syncOpenMeteo(lat?: number, lng?: number): Promise<NormalizedWeather> {
    return this.openMeteoProvider.syncNow(lat, lng);
  }

  async getHealth(): Promise<IntegrationHealth> {
    const activeScenario = this.scenarioProvider.getActiveScenario();
    if (activeScenario) {
      return this.scenarioProvider.getHealth();
    }

    if (env.DATA_MODE === 'research' || env.DATA_MODE === 'hybrid') {
      return this.openMeteoProvider.getHealth();
    }

    if (env.DATA_MODE === 'live') {
      return this.liveProvider.getHealth();
    }

    return this.demoProvider.getHealth();
  }

  getScenarioProvider(): ScenarioWeatherProvider {
    return this.scenarioProvider;
  }

  getOpenMeteoProvider(): OpenMeteoProvider {
    return this.openMeteoProvider;
  }
}

export const weatherService = new WeatherService();
