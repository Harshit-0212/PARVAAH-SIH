import mongoose, { Schema, Model } from 'mongoose';
import { IRiskAssessment } from '../../types/db';

const RiskAssessmentSchema = new Schema<IRiskAssessment>(
  {
    districtId: {
      type: Schema.Types.ObjectId,
      ref: 'District',
      required: [true, 'District ID is required'],
      index: true,
    },
    villageId: {
      type: Schema.Types.ObjectId,
      ref: 'Village',
      index: true,
    },
    roadId: {
      type: Schema.Types.ObjectId,
      ref: 'Road',
      index: true,
    },
    riskScore: {
      type: Number,
      required: [true, 'Risk score is required'],
      min: [0, 'Risk score must be at least 0'],
      max: [100, 'Risk score cannot exceed 100'],
    },
    riskLevel: {
      type: String,
      enum: ['low', 'moderate', 'high', 'severe'],
      required: [true, 'Risk level is required'],
      index: true,
    },
    reasoning: {
      type: String,
      required: [true, 'Risk reasoning analysis is required'],
      trim: true,
    },
    modelVersion: {
      type: String,
      default: 'v1.0.0',
      trim: true,
    },
    assessedAt: {
      type: Date,
      required: [true, 'Assessment timestamp is required'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
RiskAssessmentSchema.index({ districtId: 1, riskLevel: 1, assessedAt: -1 });

export const RiskAssessment: Model<IRiskAssessment> =
  mongoose.models.RiskAssessment || mongoose.model<IRiskAssessment>('RiskAssessment', RiskAssessmentSchema);
export default RiskAssessment;
