import mongoose, { Schema, Document, Model } from 'mongoose';

export type HazardType = 'landslide' | 'debris_flow' | 'rockfall' | 'slope_crack' | 'flash_flood';
export type GuideType = 'what_to_do' | 'what_not_to_do' | 'danger_zone_protocol';

export interface ISafetyGuide extends Document {
  hazardType: HazardType;
  guideType: GuideType;
  title: Record<string, string>;
  content: Record<string, string[]>;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SafetyGuideSchema = new Schema<ISafetyGuide>(
  {
    hazardType: {
      type: String,
      enum: ['landslide', 'debris_flow', 'rockfall', 'slope_crack', 'flash_flood'],
      required: true,
      index: true,
    },
    guideType: {
      type: String,
      enum: ['what_to_do', 'what_not_to_do', 'danger_zone_protocol'],
      required: true,
      index: true,
    },
    title: { type: Map, of: String, required: true },
    content: { type: Map, of: [String], required: true },
    priority: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

SafetyGuideSchema.index({ hazardType: 1, guideType: 1, isActive: 1 });

export const SafetyGuide: Model<ISafetyGuide> =
  mongoose.models.SafetyGuide || mongoose.model<ISafetyGuide>('SafetyGuide', SafetyGuideSchema);
export default SafetyGuide;
