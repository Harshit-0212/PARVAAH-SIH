import mongoose, { Schema, Model } from 'mongoose';
import { IDistrict } from '../../types/db';

const GeoJSONPolygonSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['Polygon', 'MultiPolygon'],
      required: true,
    },
    coordinates: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  { _id: false }
);

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
        message: 'Coordinates must be [longitude (-180 to 180), latitude (-90 to 90)]',
      },
    },
  },
  { _id: false }
);

const DistrictSchema = new Schema<IDistrict>(
  {
    name: {
      type: String,
      required: [true, 'District name is required'],
      trim: true,
      index: true,
    },
    stateName: {
      type: String,
      required: [true, 'State name is required'],
      default: 'Assam',
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'District code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    boundary: {
      type: GeoJSONPolygonSchema,
      required: [true, 'District GeoJSON boundary polygon is required'],
    },
    center: {
      type: GeoJSONPointSchema,
      required: [true, 'District GeoJSON center point is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Geospatial 2dsphere indexes
DistrictSchema.index({ center: '2dsphere' });
DistrictSchema.index({ boundary: '2dsphere' });

export const District: Model<IDistrict> =
  mongoose.models.District || mongoose.model<IDistrict>('District', DistrictSchema);
export default District;
