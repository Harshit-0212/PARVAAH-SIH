import mongoose, { Schema, Document } from 'mongoose';
import { RiskCategory } from '../types/risk.js';

export interface IWardRiskDocument extends Document {
  wardId: string;
  wardName: string;
  district: string;
  state: string;
  riskScore: number;
  riskCategory: RiskCategory;
  leadTimeHours: number;
  actionText: string;
  rainfall_24h: number;
  rainfall_forecast_6h: number;
  rainfall_forecast_24h: number;
  slope: number;
  elevation: number;
  dist_to_stream: number;
  historical_flood_count: number;
  streamName: string;
  recommendedShelter: string;
  evacuationRoute: string;
  updatedAt: Date;
}

const WardRiskSchema = new Schema<IWardRiskDocument>(
  {
    wardId: { type: String, required: true, unique: true, index: true },
    wardName: { type: String, required: true },
    district: { type: String, default: 'Kamrup' },
    state: { type: String, default: 'Assam' },
    riskScore: { type: Number, required: true, min: 0, max: 100 },
    riskCategory: { 
      type: String, 
      required: true, 
      enum: ['Low', 'Medium', 'High', 'Very High'],
      index: true
    },
    leadTimeHours: { type: Number, required: true, default: 24 },
    actionText: { type: String, required: true },
    rainfall_24h: { type: Number, default: 0 },
    rainfall_forecast_6h: { type: Number, default: 0 },
    rainfall_forecast_24h: { type: Number, default: 0 },
    slope: { type: Number, default: 0 },
    elevation: { type: Number, default: 0 },
    dist_to_stream: { type: Number, default: 0 },
    historical_flood_count: { type: Number, default: 0 },
    streamName: { type: String, default: 'Local River Stream' },
    recommendedShelter: { type: String, default: 'Govt Community Flood Center' },
    evacuationRoute: { type: String, default: 'High-elevation Bypass Corridor' },
  },
  {
    timestamps: true,
  }
);

export const WardRiskModel = mongoose.model<IWardRiskDocument>('WardRisk', WardRiskSchema);
