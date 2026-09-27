import mongoose, { Schema, Model } from 'mongoose';
import { ISyncQueue } from '../../types/db';

const SyncQueueSchema = new Schema<ISyncQueue>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required for offline sync queue item'],
      index: true,
    },
    entityType: {
      type: String,
      enum: ['Report', 'Incident', 'RoadStatus'],
      required: [true, 'Entity type is required'],
    },
    entityId: {
      type: Schema.Types.ObjectId,
    },
    actionType: {
      type: String,
      enum: ['CREATE', 'UPDATE', 'DELETE'],
      required: [true, 'Action type is required'],
    },
    payload: {
      type: Schema.Types.Mixed,
      required: [true, 'Sync payload data is required'],
    },
    syncStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    retryCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastError: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
SyncQueueSchema.index({ userId: 1, syncStatus: 1, createdAt: -1 });

export const SyncQueue: Model<ISyncQueue> =
  mongoose.models.SyncQueue || mongoose.model<ISyncQueue>('SyncQueue', SyncQueueSchema);
export default SyncQueue;
