import mongoose, { Schema, Model } from 'mongoose';
import { IReport } from '../../types/db';

const GeoJSONPointSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function (val: number[]) {
          return val.length === 2 && val[0] >= -180 && val[0] <= 180 && val[1] >= -90 && val[1] <= 90;
        },
        message: 'Coordinates must be [longitude, latitude]',
      },
    },
  },
  { _id: false }
);

const ReportSchema = new Schema<IReport>(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter ID is required'],
      index: true,
    },
    incidentId: {
      type: Schema.Types.ObjectId,
      ref: 'Incident',
      index: true,
    },
    districtId: {
      type: Schema.Types.ObjectId,
      ref: 'District',
      required: [true, 'District ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Report title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Report description is required'],
      trim: true,
    },
    mediaUrls: {
      type: [String],
      default: [],
    },
    location: {
      type: GeoJSONPointSchema,
      required: [true, 'Report location GeoJSON Point is required'],
    },
    reportStatus: {
      type: String,
      enum: ['pending_verification', 'verified', 'rejected', 'duplicate'],
      default: 'pending_verification',
      index: true,
    },
    // Offline sync fields
    offlineCreatedAt: {
      type: Date,
    },
    syncedAt: {
      type: Date,
    },
    clientTempId: {
      type: String,
      trim: true,
      index: true,
    },
    dedupeHash: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ReportSchema.index({ location: '2dsphere' });
ReportSchema.index({ districtId: 1, reportStatus: 1, createdAt: -1 });
ReportSchema.index({ reporterId: 1, createdAt: -1 });

export const Report: Model<IReport> =
  mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);
export default Report;
