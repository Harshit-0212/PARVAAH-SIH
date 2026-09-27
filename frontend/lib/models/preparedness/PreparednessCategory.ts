import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPreparednessCategory extends Document {
  key: string;
  title: Record<string, string>; // e.g. { en: "Water & Hydration", as: "পানী আৰু খাদ্য" }
  description?: Record<string, string>;
  iconName: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PreparednessCategorySchema = new Schema<IPreparednessCategory>(
  {
    key: { type: String, required: true, unique: true, index: true, trim: true },
    title: { type: Map, of: String, required: true },
    description: { type: Map, of: String },
    iconName: { type: String, default: 'Package' },
    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const PreparednessCategory: Model<IPreparednessCategory> =
  mongoose.models.PreparednessCategory ||
  mongoose.model<IPreparednessCategory>('PreparednessCategory', PreparednessCategorySchema);
export default PreparednessCategory;
