import mongoose, { Schema, Document } from 'mongoose';
import type { NormalizedWeather } from '../types/index.js';

export interface IWeatherSnapshotDoc extends Document, NormalizedWeather {}

const WeatherSnapshotSchema = new Schema<IWeatherSnapshotDoc>(
  {
    provider: { type: String, required: true, enum: ['IMD', 'OPEN_METEO', 'SCENARIO'] },
    sourceType: {
      type: String,
      required: true,
      enum: ['IMD_LIVE', 'IMD_DEMO', 'OPEN_METEO_FORECAST', 'SIMULATED_SCENARIO']
    },
    isLive: { type: Boolean, required: true },
    isDemo: { type: Boolean, required: true },
    isOfficialWarning: { type: Boolean, required: true, default: false },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    district: { type: String, index: true },
    state: { type: String },
    rainfall1hMm: { type: Number, default: 0 },
    rainfall3hMm: { type: Number, default: 0 },
    rainfall24hMm: { type: Number, default: 0 },
    forecastRainfall24hMm: { type: Number, default: 0 },
    forecastRainfall72hMm: { type: Number, default: 0 },
    warningLevel: { type: String, enum: ['GREEN', 'YELLOW', 'ORANGE', 'RED'] },
    warningType: { type: String },
    warningText: { type: String },
    observedAt: { type: String },
    fetchedAt: { type: String, required: true, default: () => new Date().toISOString() },
    validUntil: { type: String },
    dataAgeMinutes: { type: Number, default: 0 },
    dataFreshness: { type: String, enum: ['FRESH', 'AGING', 'STALE', 'UNKNOWN'], default: 'FRESH' },
    disclaimer: { type: String, required: true }
  },
  { timestamps: true }
);

WeatherSnapshotSchema.index({ district: 1, fetchedAt: -1 });
WeatherSnapshotSchema.index({ latitude: 1, longitude: 1 });

export const WeatherSnapshotModel =
  mongoose.models.WeatherSnapshot || mongoose.model<IWeatherSnapshotDoc>('WeatherSnapshot', WeatherSnapshotSchema);
