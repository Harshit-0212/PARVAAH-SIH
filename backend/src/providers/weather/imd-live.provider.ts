import type { WeatherProvider, WeatherQuery } from './weather-provider.interface.js';
import type { NormalizedWeather, NormalizedForecast, IntegrationHealth } from '../../types/index.js';
import { env } from '../../config/env.js';

export class ImdLiveProvider implements WeatherProvider {
  private isConfigured(): boolean {
    return Boolean(env.IMD_ENABLED && env.IMD_API_BASE_URL && env.IMD_API_KEY);
  }

  async getCurrentWeather(_input: WeatherQuery): Promise<NormalizedWeather | NormalizedWeather[]> {
    if (!env.IMD_ENABLED) {
      throw new Error('IMD live integration is disabled in system configuration.');
    }
    if (!this.isConfigured()) {
      throw new Error('IMD live integration is enabled but required configuration (IMD_API_BASE_URL / IMD_API_KEY) is missing.');
    }

    // Official endpoint specification pending institutional clearance
    throw new Error('IMD live endpoint contract is not yet implemented pending institutional data-sharing agreement.');
  }

  async getForecast(_input: WeatherQuery): Promise<NormalizedForecast> {
    if (!env.IMD_ENABLED || !this.isConfigured()) {
      throw new Error('IMD forecast endpoint is not configured.');
    }
    throw new Error('IMD official forecast parser pending agency contract definition.');
  }

  async getHealth(): Promise<IntegrationHealth> {
    if (!env.IMD_ENABLED) {
      return {
        name: 'India Meteorological Department (IMD) Gateway',
        configured: false,
        status: 'DEMO',
        isLive: false,
        lastSuccessfulFetch: null,
        lastAttemptAt: null,
        lastError: null,
        dataAgeMinutes: 0,
        sourceType: 'DEMO',
        message: 'IMD live integration is disabled. IMD-compatible demo weather data is active.'
      };
    }

    if (!env.IMD_API_BASE_URL || !env.IMD_API_KEY) {
      return {
        name: 'India Meteorological Department (IMD) Gateway',
        configured: false,
        status: 'NOT_CONFIGURED',
        isLive: false,
        lastSuccessfulFetch: null,
        lastAttemptAt: null,
        lastError: 'Missing IMD_API_BASE_URL or IMD_API_KEY',
        dataAgeMinutes: 0,
        sourceType: 'NOT_CONFIGURED',
        message: 'IMD live integration enabled but required configuration is missing.'
      };
    }

    // Enabled and credentials present, but official parser/endpoint agreement pending
    return {
      name: 'India Meteorological Department (IMD) Gateway',
      configured: true,
      status: 'NOT_CONFIGURED',
      isLive: false,
      lastSuccessfulFetch: null,
      lastAttemptAt: null,
      lastError: 'Pending official API endpoint contract and response schema mapping',
      dataAgeMinutes: 0,
      sourceType: 'NOT_CONFIGURED',
      message: 'IMD credentials/configuration exist, but the official endpoint contract has not been configured.'
    };
  }

  /**
   * Diagnostic read-only probe for POST /api/v1/integrations/imd/test
   * Never leaks API key, never calls unverified endpoints, returns safe diagnostic.
   */
  async testConnection(): Promise<{ success: boolean; status: string; message: string; timestamp: string }> {
    const timestamp = new Date().toISOString();

    if (!env.IMD_ENABLED) {
      return {
        success: false,
        status: 'DISABLED',
        message: 'IMD live integration is currently disabled (IMD_ENABLED=false).',
        timestamp
      };
    }

    if (!env.IMD_API_BASE_URL || !env.IMD_API_KEY) {
      return {
        success: false,
        status: 'NOT_CONFIGURED',
        message: 'IMD live integration enabled but required configuration (IMD_API_BASE_URL / IMD_API_KEY) is missing.',
        timestamp
      };
    }

    // Safety guard: We never make unverified HTTP calls to invented or arbitrary endpoints.
    return {
      success: false,
      status: 'NOT_CONFIGURED',
      message: 'IMD credentials exist, but official institutional endpoint specification and schema parser are awaiting implementation.',
      timestamp
    };
  }
}
