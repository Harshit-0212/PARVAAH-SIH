import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IScenarioOverrideDoc extends Document {
  overrideId: string;
  scenarioId: string;
  scenarioName: string;
  district: string;
  createdAt: Date;
  expiresAt: Date;
  active: boolean;
  createdBy: string;
  affectedEntityIds: string[];
  overrides: {
    rainfall24hMm?: number;
    forecastRainfall24hMm?: number;
    soilMoisturePercent?: number;
    slopeDegrees?: number;
    roadStatus?: string;
    shelterOccupancyPercent?: number;
  };
  recalculatedZoneIds: string[];
}

const ScenarioOverrideSchema = new Schema<IScenarioOverrideDoc>(
  {
    overrideId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    scenarioId: {
      type: String,
      required: true,
      index: true
    },
    scenarioName: {
      type: String,
      required: true
    },
    district: {
      type: String,
      required: true,
      index: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    },
    createdBy: {
      type: String,
      default: 'College Demo Controller'
    },
    affectedEntityIds: {
      type: [String],
      default: []
    },
    overrides: {
      type: Schema.Types.Mixed,
      default: {}
    },
    recalculatedZoneIds: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true,
    collection: 'scenario_overrides'
  }
);

export const ScenarioOverrideModel: Model<IScenarioOverrideDoc> =
  mongoose.models.ScenarioOverride || mongoose.model<IScenarioOverrideDoc>('ScenarioOverride', ScenarioOverrideSchema);
