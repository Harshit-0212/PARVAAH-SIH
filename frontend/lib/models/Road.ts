import mongoose, { Schema, Model } from 'mongoose';
import { IRoad } from '../../types/db';

const GeoJSONGeometrySchema = new Schema(
  {
    type: {
      type: String,
      enum: ['LineString', 'MultiLineString'],
      required: true,
    },
    coordinates: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  { _id: false }
);

const RoadSchema = new Schema<IRoad>(
  {
    districtId: {
      type: Schema.Types.ObjectId,
      ref: 'District',
      required: [true, 'District ID is required'],
      index: true,
    },
    roadName: {
      type: String,
      required: [true, 'Road name is required'],
      trim: true,
    },
    roadCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['open', 'at_risk', 'blocked'],
      default: 'open',
      index: true,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'moderate', 'high', 'severe'],
      default: 'low',
      index: true,
    },
    geometry: {
      type: GeoJSONGeometrySchema,
      required: [true, 'Road GeoJSON geometry is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
RoadSchema.index({ geometry: '2dsphere' });
RoadSchema.index({ districtId: 1, status: 1 });
RoadSchema.index({ districtId: 1, riskLevel: 1 });

export const Road: Model<IRoad> = mongoose.models.Road || mongoose.model<IRoad>('Road', RoadSchema);
export default Road;
