import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IEvacuationGuide extends Document {
  districtId?: Types.ObjectId;
  title: Record<string, string>;
  instructions: Record<string, string[]>;
  hazardZoneLevel: 'high_alert' | 'warning' | 'advisory';
  assemblyPoints?: Array<{
    name: string;
    location: { type: string; coordinates: [number, number] };
    capacity?: number;
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EvacuationGuideSchema = new Schema<IEvacuationGuide>(
  {
    districtId: { type: Schema.Types.ObjectId, ref: 'District', index: true },
    title: { type: Map, of: String, required: true },
    instructions: { type: Map, of: [String], required: true },
    hazardZoneLevel: {
      type: String,
      enum: ['high_alert', 'warning', 'advisory'],
      default: 'warning',
    },
    assemblyPoints: [
      {
        name: { type: String, required: true },
        location: {
          type: { type: String, enum: ['Point'], default: 'Point' },
          coordinates: { type: [Number], required: true }, // [longitude, latitude]
        },
        capacity: Number,
      },
    ],
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

EvacuationGuideSchema.index({ 'assemblyPoints.location': '2dsphere' });

export const EvacuationGuide: Model<IEvacuationGuide> =
  mongoose.models.EvacuationGuide ||
  mongoose.model<IEvacuationGuide>('EvacuationGuide', EvacuationGuideSchema);
export default EvacuationGuide;
