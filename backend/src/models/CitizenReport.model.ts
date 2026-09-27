import mongoose, { Schema, Document, Model } from 'mongoose';

export type ReportVerificationStatus =
  | 'UNDER_VERIFICATION'
  | 'ASSIGNED'
  | 'VERIFIED'
  | 'REJECTED'
  | 'DUPLICATE'
  | 'RESOLVED'
  | 'ARCHIVED';

export interface IAttachmentSummary {
  attachmentId: string;
  originalFilename: string;
  mediaType: 'photo' | 'video';
  mimeType: string;
  sizeBytes: number;
  sha256Hash: string; // File Integrity Record
  servingUrl: string;
  uploadedAt: Date;
}

export interface IEvidenceConfidence {
  score: number; // 0 - 100
  mediaQualityScore: number;
  gpsQualityScore: number;
  freshnessScore: number;
  corroborationScore: number;
  officerCorroborated: boolean;
  explanation: string;
}

export interface IAssignmentSummary {
  assignmentId?: string;
  assignedToUserId?: string;
  assignedOfficerName?: string;
  assignedAgency?: 'PWD' | 'SDRF' | 'DDMA' | 'POLICE' | 'FOREST' | 'BRO' | 'OTHER';
  assignedRole?: 'field_officer' | 'district_officer' | 'engineer';
  assignedBy?: string;
  assignedAt?: Date;
  status?: 'ASSIGNED' | 'CLAIMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
}

export type LocationResolutionStatus = 'RESOLVED' | 'OUTSIDE_SERVICE_REGION' | 'UNRESOLVED' | 'MANUAL_CONFIRMED';

export interface ICitizenReportDoc extends Document {
  clientReportId: string;
  serverReportId: string;
  hazardType: string;
  description: string;
  district: string;
  state: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  latitude: number;
  longitude: number;
  gpsAccuracy?: number;
  locationResolutionStatus?: LocationResolutionStatus;
  qualityFlags?: string[];
  nearestRoad?: string;
  roadCondition?: string;
  numberOfPeopleAffected?: number;
  contactNumber?: string;
  reporterRole: 'citizen' | 'field_officer' | 'district_officer' | 'admin';
  status: 'UNDER_VERIFICATION' | 'ASSIGNED' | 'VERIFIED' | 'REJECTED' | 'DUPLICATE' | 'RESOLVED' | 'ARCHIVED';
  verificationStatus: ReportVerificationStatus;
  verifiedBy?: string;
  verifiedAt?: Date;
  verificationNotes?: string;
  assignment?: IAssignmentSummary;
  evidenceConfidence?: IEvidenceConfidence;
  attachments?: IAttachmentSummary[];
  attachmentMetadata?: Array<Record<string, any>>;
  attachmentIds?: string[];
  possibleDuplicateIds?: string[];
  scenarioId?: string | null;
  captureTimestamp: Date;
  receivedAt: Date;
  source: string;
  isDemo: boolean;
  isLive: boolean;
  dataFreshness: 'FRESH' | 'AGING' | 'STALE' | 'UNKNOWN';
  createdAt: Date;
  updatedAt: Date;
}

const GeoPointSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true
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
        message: 'Coordinates must be [longitude, latitude] with valid geospatial bounds'
      }
    }
  },
  { _id: false }
);

const CitizenReportSchema = new Schema<ICitizenReportDoc>(
  {
    clientReportId: {
      type: String,
      required: [true, 'Client report ID is required for idempotency'],
      unique: true,
      trim: true,
      index: true
    },
    serverReportId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    hazardType: {
      type: String,
      required: [true, 'Hazard type is required'],
      enum: [
        'LANDSLIDE',
        'FLASH_FLOOD',
        'RIVER_FLOOD',
        'CYCLONE',
        'ROAD_BLOCKAGE',
        'BRIDGE_DAMAGE',
        'SLOPE_CRACK',
        'INFRASTRUCTURE_FAILURE'
      ],
      index: true
    },
    description: {
      type: String,
      required: [true, 'Report description is required'],
      trim: true,
      minlength: [5, 'Description must be at least 5 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    district: {
      type: String,
      required: true,
      default: 'east_sikkim',
      index: true
    },
    state: {
      type: String,
      default: 'North East India',
      index: true
    },
    location: {
      type: GeoPointSchema,
      required: true
    },
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    },
    gpsAccuracy: {
      type: Number,
      default: 10
    },
    locationResolutionStatus: {
      type: String,
      enum: ['RESOLVED', 'OUTSIDE_SERVICE_REGION', 'UNRESOLVED', 'MANUAL_CONFIRMED'],
      default: 'UNRESOLVED',
      index: true
    },
    qualityFlags: {
      type: [String],
      default: []
    },
    nearestRoad: {
      type: String,
      trim: true
    },
    roadCondition: {
      type: String,
      enum: ['OPEN', 'PARTIALLY_BLOCKED', 'CLOSED', 'UNKNOWN'],
      default: 'UNKNOWN'
    },
    numberOfPeopleAffected: {
      type: Number,
      default: 0,
      min: 0
    },
    contactNumber: {
      type: String,
      trim: true,
      maxlength: 30
    },
    reporterRole: {
      type: String,
      enum: ['citizen', 'field_officer', 'district_officer', 'admin'],
      default: 'citizen'
    },
    status: {
      type: String,
      enum: ['UNDER_VERIFICATION', 'ASSIGNED', 'VERIFIED', 'REJECTED', 'DUPLICATE', 'RESOLVED', 'ARCHIVED'],
      default: 'UNDER_VERIFICATION',
      index: true
    },
    verificationStatus: {
      type: String,
      enum: ['UNDER_VERIFICATION', 'ASSIGNED', 'VERIFIED', 'REJECTED', 'DUPLICATE', 'RESOLVED', 'ARCHIVED'],
      default: 'UNDER_VERIFICATION',
      index: true
    },
    verifiedBy: {
      type: String,
      trim: true
    },
    verifiedAt: {
      type: Date
    },
    verificationNotes: {
      type: String,
      trim: true
    },
    assignment: {
      assignmentId: String,
      assignedToUserId: String,
      assignedOfficerName: String,
      assignedAgency: {
        type: String,
        enum: ['PWD', 'SDRF', 'DDMA', 'POLICE', 'FOREST', 'BRO', 'OTHER']
      },
      assignedRole: {
        type: String,
        enum: ['field_officer', 'district_officer', 'engineer']
      },
      assignedBy: String,
      assignedAt: Date,
      status: {
        type: String,
        enum: ['ASSIGNED', 'CLAIMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
        default: 'ASSIGNED'
      },
      notes: String
    },
    evidenceConfidence: {
      score: { type: Number, default: 50 },
      mediaQualityScore: { type: Number, default: 0 },
      gpsQualityScore: { type: Number, default: 0 },
      freshnessScore: { type: Number, default: 0 },
      corroborationScore: { type: Number, default: 0 },
      officerCorroborated: { type: Boolean, default: false },
      explanation: String
    },
    attachments: [
      {
        attachmentId: { type: String, required: true },
        originalFilename: { type: String, required: true },
        mediaType: { type: String, enum: ['photo', 'video', 'IMAGE', 'VIDEO'], required: true },
        mimeType: { type: String, required: true },
        sizeBytes: { type: Number, required: true },
        sha256Hash: { type: String, required: true },
        servingUrl: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    attachmentMetadata: [
      {
        id: { type: String },
        attachmentId: { type: String },
        originalFilename: { type: String },
        mediaType: { type: String },
        mimeType: { type: String },
        byteSize: { type: Number },
        sizeBytes: { type: Number },
        sha256: { type: String },
        sha256Hash: { type: String },
        storageProvider: { type: String },
        storageKey: { type: String },
        uploadStatus: { type: String, default: 'COMPLETED' },
        uploadedAt: { type: Date, default: Date.now },
        hasPreview: { type: Boolean, default: true },
        servingUrl: { type: String }
      }
    ],
    attachmentIds: {
      type: [String],
      default: []
    },
    possibleDuplicateIds: {
      type: [String],
      default: []
    },
    scenarioId: {
      type: String,
      default: null
    },
    captureTimestamp: {
      type: Date,
      default: Date.now
    },
    receivedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    source: {
      type: String,
      default: 'CITIZEN_REPORT_INGESTION'
    },
    isDemo: {
      type: Boolean,
      default: true
    },
    isLive: {
      type: Boolean,
      default: false
    },
    dataFreshness: {
      type: String,
      enum: ['FRESH', 'AGING', 'STALE', 'UNKNOWN'],
      default: 'FRESH'
    }
  },
  {
    timestamps: true
  }
);

// Compound and geospatial indexes
CitizenReportSchema.index({ location: '2dsphere' });
CitizenReportSchema.index({ verificationStatus: 1, receivedAt: -1 });
CitizenReportSchema.index({ district: 1, verificationStatus: 1, receivedAt: -1 });

export const CitizenReportModel: Model<ICitizenReportDoc> =
  mongoose.models.CitizenReport || mongoose.model<ICitizenReportDoc>('CitizenReport', CitizenReportSchema);
