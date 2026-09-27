import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type IncidentCategory =
  | 'landslide'
  | 'road_blockage'
  | 'crack'
  | 'slope_movement'
  | 'debris_flow'
  | 'flood_related_damage'
  | 'retaining_wall_failure'
  | 'other';

export type VerificationStatus =
  | 'draft'
  | 'uploaded'
  | 'pending_verification'
  | 'under_review'
  | 'verified'
  | 'rejected'
  | 'escalated'
  | 'resolved'
  | 'duplicate';

export type SourceType = 'citizen' | 'field_officer' | 'automated_sensor';

export interface IMediaReport extends Document {
  reporterId: Types.ObjectId;
  clientTempId?: string;
  incidentType: IncidentCategory;
  description: string;
  capturedAt: Date;
  uploadedAt: Date;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  gpsAccuracy: number;
  districtId?: Types.ObjectId;
  roadId?: Types.ObjectId;
  villageId?: Types.ObjectId;
  taggedOfficialId?: Types.ObjectId;
  taggedTeamType?: 'pwd' | 'sdrf' | 'ddma' | 'police' | 'forest';
  verificationStatus: VerificationStatus;
  sourceType: SourceType;
  confidenceScore: number;
  duplicateCandidateIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const MediaReportSchema = new Schema<IMediaReport>(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    clientTempId: { type: String, index: true },
    incidentType: {
      type: String,
      enum: [
        'landslide',
        'road_blockage',
        'crack',
        'slope_movement',
        'debris_flow',
        'flood_related_damage',
        'retaining_wall_failure',
        'other',
      ],
      required: true,
      index: true,
    },
    description: { type: String, required: true, trim: true },
    capturedAt: { type: Date, required: true, index: true },
    uploadedAt: { type: Date, default: Date.now },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: function (val: number[]) {
            return (
              Array.isArray(val) &&
              val.length === 2 &&
              val[0] >= -180 &&
              val[0] <= 180 &&
              val[1] >= -90 &&
              val[1] <= 90
            );
          },
          message: 'Location coordinates must be valid [longitude, latitude].',
        },
      },
    },
    gpsAccuracy: { type: Number, required: true },
    districtId: { type: Schema.Types.ObjectId, ref: 'District', index: true },
    roadId: { type: Schema.Types.ObjectId, ref: 'Road', index: true },
    villageId: { type: Schema.Types.ObjectId, ref: 'Village' },
    taggedOfficialId: { type: Schema.Types.ObjectId, ref: 'User' },
    taggedTeamType: {
      type: String,
      enum: ['pwd', 'sdrf', 'ddma', 'police', 'forest'],
      default: 'ddma',
    },
    verificationStatus: {
      type: String,
      enum: [
        'draft',
        'uploaded',
        'pending_verification',
        'under_review',
        'verified',
        'rejected',
        'escalated',
        'resolved',
        'duplicate',
      ],
      default: 'pending_verification',
      index: true,
    },
    sourceType: {
      type: String,
      enum: ['citizen', 'field_officer', 'automated_sensor'],
      default: 'citizen',
    },
    confidenceScore: { type: Number, default: 50, min: 0, max: 100 },
    duplicateCandidateIds: [{ type: Schema.Types.ObjectId, ref: 'MediaReport' }],
  },
  { timestamps: true }
);

// 2dsphere Geospatial index
MediaReportSchema.index({ location: '2dsphere' });

// Compound operational indexes
MediaReportSchema.index({ districtId: 1, verificationStatus: 1, createdAt: -1 });
MediaReportSchema.index({ roadId: 1, verificationStatus: 1 });
MediaReportSchema.index({ incidentType: 1, capturedAt: -1 });

export const MediaReport: Model<IMediaReport> =
  mongoose.models.MediaReport || mongoose.model<IMediaReport>('MediaReport', MediaReportSchema);
export default MediaReport;
