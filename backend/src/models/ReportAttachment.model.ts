import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReportAttachmentDoc extends Document {
  attachmentId: string;
  reportId: string;
  originalFilename: string;
  mediaType: 'photo' | 'video';
  mimeType: string;
  sizeBytes: number;
  sha256Hash: string; // File Integrity Record
  storageProvider: 'local' | 's3';
  storagePath: string;
  storageKey: string;
  thumbnailKey?: string;
  deviceCapturedAt?: Date;
  uploadedAt: Date;
  gpsLatitude?: number;
  gpsLongitude?: number;
  uploadStatus: 'COMPLETED' | 'FAILED';
  virusScanStatus: 'NOT_CONFIGURED' | 'CLEAN' | 'PENDING_SCAN';
  servingUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportAttachmentSchema = new Schema<IReportAttachmentDoc>(
  {
    attachmentId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    reportId: {
      type: String,
      required: true,
      index: true
    },
    originalFilename: {
      type: String,
      required: true,
      trim: true
    },
    mediaType: {
      type: String,
      enum: ['photo', 'video'],
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    sizeBytes: {
      type: Number,
      required: true,
      min: 0
    },
    sha256Hash: {
      type: String,
      required: true,
      index: true
    },
    storageProvider: {
      type: String,
      enum: ['local', 's3'],
      default: 'local'
    },
    storagePath: {
      type: String,
      required: true
    },
    storageKey: {
      type: String,
      required: true
    },
    thumbnailKey: {
      type: String
    },
    deviceCapturedAt: {
      type: Date
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    gpsLatitude: {
      type: Number
    },
    gpsLongitude: {
      type: Number
    },
    uploadStatus: {
      type: String,
      enum: ['COMPLETED', 'FAILED'],
      default: 'COMPLETED'
    },
    virusScanStatus: {
      type: String,
      enum: ['NOT_CONFIGURED', 'CLEAN', 'PENDING_SCAN'],
      default: 'NOT_CONFIGURED'
    },
    servingUrl: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true,
    collection: 'report_attachments'
  }
);

export const ReportAttachmentModel: Model<IReportAttachmentDoc> =
  mongoose.models.ReportAttachment || mongoose.model<IReportAttachmentDoc>('ReportAttachment', ReportAttachmentSchema);
