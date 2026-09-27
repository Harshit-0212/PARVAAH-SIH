import mongoose, { Schema, Document } from 'mongoose';
import type { ScenarioRecord } from '../types/index.js';

export interface IScenarioDoc extends Document, ScenarioRecord {}

const ScenarioSchema = new Schema<IScenarioDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    district: { type: String, required: true, index: true },
    state: { type: String, default: 'North East India' },
    latitude: { type: Number },
    longitude: { type: Number },
    rainfall24hMm: { type: Number, required: true },
    forecastRainfall24hMm: { type: Number, required: true },
    forecastRainfall72hMm: { type: Number, default: 0 },
    soilMoisturePercent: { type: Number, required: true },
    slopeDegrees: { type: Number, required: true },
    historicalSusceptibility: { type: Number, default: 50 },
    verifiedReportCount: { type: Number, default: 0 },
    verifiedReportSeverity: {
      type: String,
      enum: ['NONE', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'],
      default: 'NONE'
    },
    roadStatus: {
      type: String,
      enum: ['OPEN', 'PARTIALLY_BLOCKED', 'CLOSED', 'UNKNOWN'],
      default: 'OPEN'
    },
    shelterOccupancyPercent: { type: Number, default: 40 },
    durationMinutes: { type: Number, required: true, default: 30 },
    operator: { type: String, default: 'Admin Console' },
    isActive: { type: Boolean, default: false, index: true },
    createdAt: { type: String, default: () => new Date().toISOString() },
    expiresAt: { type: String, required: true },
    activatedAt: { type: String }
  },
  { timestamps: true }
);

export const ScenarioModel =
  mongoose.models.Scenario || mongoose.model<IScenarioDoc>('Scenario', ScenarioSchema);
