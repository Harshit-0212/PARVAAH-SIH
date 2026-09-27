import mongoose, { Schema, Document } from 'mongoose';

export interface IRiskZone extends Document {
  id: string; // e.g. ZONE-SKM-01
  zoneName: string;
  district: string;
  state: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  confidence: number;
  modelMode: 'PRACTICE_XGBOOST' | 'DEMO_RULE_BASED' | 'SIMULATED_SCENARIO';
  modelVersion: string;
  slopeDegrees: number;
  historicalLandslideDensity: number;
  affectedVillages: string[];
  affectedRoadSegments: string[];
  nearbyShelters: string[];
  recommendedAction: string;
  disclaimer: string;
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  lastCalculatedAt: Date;
  isDemo: boolean;
  isLive: boolean;
}

const RiskZoneSchema = new Schema<IRiskZone>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    zoneName: {
      type: String,
      required: true
    },
    district: {
      type: String,
      required: true,
      index: true
    },
    state: {
      type: String,
      default: 'North East India'
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'],
      required: true
    },
    confidence: {
      type: Number,
      default: 85
    },
    modelMode: {
      type: String,
      enum: ['PRACTICE_XGBOOST', 'DEMO_RULE_BASED', 'SIMULATED_SCENARIO'],
      default: 'DEMO_RULE_BASED'
    },
    modelVersion: {
      type: String,
      default: 'practice-xgboost-v1'
    },
    slopeDegrees: {
      type: Number,
      required: true,
      min: 0,
      max: 90
    },
    historicalLandslideDensity: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    affectedVillages: {
      type: [String],
      default: []
    },
    affectedRoadSegments: {
      type: [String],
      default: []
    },
    nearbyShelters: {
      type: [String],
      default: []
    },
    recommendedAction: {
      type: String,
      default: 'Monitor slope telemetry and stay alert for localized warnings.'
    },
    disclaimer: {
      type: String,
      default:
        'Practice-only synthetic model output. Not a real landslide warning, official warning, or evacuation decision.'
    },
    geometry: {
      type: {
        type: String,
        enum: ['Polygon'],
        required: true
      },
      coordinates: {
        type: [[[Number]]],
        required: true
      }
    },
    lastCalculatedAt: {
      type: Date,
      default: Date.now
    },
    isDemo: {
      type: Boolean,
      default: true
    },
    isLive: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export const RiskZoneModel =
  mongoose.models.RiskZone ||
  mongoose.model<IRiskZone>('RiskZone', RiskZoneSchema);
