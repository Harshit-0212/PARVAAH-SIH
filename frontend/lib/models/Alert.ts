import mongoose, { Schema, Model } from 'mongoose';
import { IAlert } from '../../types/db';

const AlertSchema = new Schema<IAlert>(
  {
    districtId: {
      type: Schema.Types.ObjectId,
      ref: 'District',
      required: [true, 'District ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Alert title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Alert message is required'],
      trim: true,
    },
    severity: {
      type: String,
      enum: ['info', 'advisory', 'warning', 'emergency'],
      required: [true, 'Alert severity is required'],
      index: true,
    },
    languageCode: {
      type: String,
      default: 'en',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    issuedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    startsAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
AlertSchema.index({ districtId: 1, isActive: 1, expiresAt: 1 });
AlertSchema.index({ severity: 1, isActive: 1 });

export const Alert: Model<IAlert> = mongoose.models.Alert || mongoose.model<IAlert>('Alert', AlertSchema);
export default Alert;
