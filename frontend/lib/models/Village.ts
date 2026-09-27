import mongoose, { Schema, Model } from 'mongoose';
import { IVillage } from '../../types/db';

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

const VillageSchema = new Schema<IVillage>(
  {
    districtId: {
      type: Schema.Types.ObjectId,
      ref: 'District',
      required: [true, 'District ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Village name is required'],
      trim: true,
    },
    population: {
      type: Number,
      default: 0,
      min: [0, 'Population cannot be negative'],
    },
    location: {
      type: GeoJSONPointSchema,
      required: [true, 'Village location GeoJSON Point is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
VillageSchema.index({ location: '2dsphere' });
VillageSchema.index({ districtId: 1, name: 1 });

export const Village: Model<IVillage> =
  mongoose.models.Village || mongoose.model<IVillage>('Village', VillageSchema);
export default Village;
