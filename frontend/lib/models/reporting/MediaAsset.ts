import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IMediaAsset extends Document {
  reportId: Types.ObjectId;
  storageProvider: 's3' | 'cloudinary' | 'local';
  storageBucket?: string;
  storagePath: string;
  publicUrl?: string;
  mediaType: 'image' | 'video';
  mimeType: string;
  durationSeconds?: number;
  sizeBytes: number;
  width?: number;
  height?: number;
  createdAt: Date;
}

const MediaAssetSchema = new Schema<IMediaAsset>(
  {
    reportId: { type: Schema.Types.ObjectId, ref: 'MediaReport', required: true, index: true },
    storageProvider: {
      type: String,
      enum: ['s3', 'cloudinary', 'local'],
      default: 's3',
    },
    storageBucket: { type: String },
    storagePath: { type: String, required: true },
    publicUrl: { type: String },
    mediaType: { type: String, enum: ['image', 'video'], required: true },
    mimeType: { type: String, required: true },
    durationSeconds: { type: Number },
    sizeBytes: { type: Number, required: true },
    width: { type: Number },
    height: { type: Number },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const MediaAsset: Model<IMediaAsset> =
  mongoose.models.MediaAsset || mongoose.model<IMediaAsset>('MediaAsset', MediaAssetSchema);
export default MediaAsset;
