import mongoose, { Schema, Model } from 'mongoose';
import { IWeatherSnapshot } from '../../types/db';

const WeatherSnapshotSchema = new Schema<IWeatherSnapshot>(
  {
    districtId: {
      type: Schema.Types.ObjectId,
      ref: 'District',
      required: [true, 'District ID is required'],
      index: true,
    },
    rainfallMm: {
      type: Number,
      required: [true, 'Rainfall value in mm is required'],
      min: [0, 'Rainfall cannot be negative'],
    },
    soilMoisture: {
      type: Number,
      min: [0, 'Soil moisture percentage cannot be negative'],
      max: [100, 'Soil moisture percentage cannot exceed 100%'],
    },
    forecastWindow: {
      type: String,
      default: '24h',
      trim: true,
    },
    sourceName: {
      type: String,
      default: 'IMD',
      trim: true,
    },
    observedAt: {
      type: Date,
      required: [true, 'Observation timestamp is required'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
WeatherSnapshotSchema.index({ districtId: 1, observedAt: -1 });

export const WeatherSnapshot: Model<IWeatherSnapshot> =
  mongoose.models.WeatherSnapshot || mongoose.model<IWeatherSnapshot>('WeatherSnapshot', WeatherSnapshotSchema);
export default WeatherSnapshot;
