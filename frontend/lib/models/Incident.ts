import mongoose, { Schema, Model } from 'mongoose';
import { IIncident } from '../../types/db';

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

const IncidentSchema = new Schema<IIncident>(
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
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    incidentType: {
      type: String,
      required: [true, 'Incident type is required (e.g. debris_flow, rockfall, mudslide)'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Incident description is required'],
      trim: true,
    },
    severity: {
      type: String,
      enum: {
        values: ['low', 'moderate', 'high', 'critical'],
        message: '{VALUE} is not a valid severity level',
      },
      required: [true, 'Severity level is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'cleared', 'monitoring'],
      default: 'open',
      index: true,
    },
    sourceType: {
      type: String,
      enum: ['citizen', 'officer', 'sensor', 'model'],
      default: 'citizen',
    },
    location: {
      type: GeoJSONPointSchema,
      required: [true, 'Incident GeoJSON location Point is required'],
    },
    mediaUrls: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
IncidentSchema.index({ location: '2dsphere' });
IncidentSchema.index({ districtId: 1, status: 1, createdAt: -1 });
IncidentSchema.index({ severity: 1, status: 1 });

export const Incident: Model<IIncident> =
  mongoose.models.Incident || mongoose.model<IIncident>('Incident', IncidentSchema);
export default Incident;
