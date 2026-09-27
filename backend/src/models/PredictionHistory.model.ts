import mongoose, { Schema, Document } from 'mongoose';

export interface IPredictionHistory extends Document {
  id: string;
  zoneId?: string;
  inputs: {
    rainfall_24h_mm: number;
    forecast_rainfall_24h_mm: number;
    soil_moisture_percent: number;
    slope_degrees: number;
    historical_landslide_density: number;
    verified_report_count: number;
  };
  inputSources?: Record<string, string>;
  output: {
    landslideProbability: number;
    riskScore: number;
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    modelVersion: string;
    modelMode: 'PRACTICE_XGBOOST' | 'DEMO_RULE_BASED';
    disclaimer: string;
  };
  latencyMs: number;
  triggeredBy: string;
  isFallback: boolean;
  calculatedAt: Date;
}

const PredictionHistorySchema = new Schema<IPredictionHistory>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    zoneId: {
      type: String,
      index: true
    },
    inputs: {
      rainfall_24h_mm: { type: Number, required: true },
      forecast_rainfall_24h_mm: { type: Number, required: true },
      soil_moisture_percent: { type: Number, required: true },
      slope_degrees: { type: Number, required: true },
      historical_landslide_density: { type: Number, required: true },
      verified_report_count: { type: Number, required: true }
    },
    inputSources: {
      type: Map,
      of: String,
      default: {}
    },
    output: {
      landslideProbability: { type: Number, required: true },
      riskScore: { type: Number, required: true },
      riskLevel: {
        type: String,
        enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'],
        required: true
      },
      modelVersion: { type: String, required: true },
      modelMode: {
        type: String,
        enum: ['PRACTICE_XGBOOST', 'DEMO_RULE_BASED'],
        required: true
      },
      disclaimer: { type: String, required: true }
    },
    latencyMs: {
      type: Number,
      default: 0
    },
    triggeredBy: {
      type: String,
      default: 'MANUAL_CALCULATOR'
    },
    isFallback: {
      type: Boolean,
      default: false
    },
    calculatedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Index for fast timeline queries
PredictionHistorySchema.index({ calculatedAt: -1 });
PredictionHistorySchema.index({ zoneId: 1, calculatedAt: -1 });

export const PredictionHistoryModel =
  mongoose.models.PredictionHistory ||
  mongoose.model<IPredictionHistory>('PredictionHistory', PredictionHistorySchema);
