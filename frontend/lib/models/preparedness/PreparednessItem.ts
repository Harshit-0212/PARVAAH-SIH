import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserCohort = 'all' | 'children' | 'elderly' | 'pwd' | 'pets';
export type PreparednessPriority = 'critical' | 'recommended' | 'optional';

export interface IPreparednessItem extends Document {
  categoryKey: string;
  itemName: Record<string, string>;
  description?: Record<string, string>;
  priority: PreparednessPriority;
  userType: UserCohort;
  isRequired: boolean;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const PreparednessItemSchema = new Schema<IPreparednessItem>(
  {
    categoryKey: { type: String, required: true, index: true },
    itemName: { type: Map, of: String, required: true },
    description: { type: Map, of: String },
    priority: {
      type: String,
      enum: ['critical', 'recommended', 'optional'],
      default: 'recommended',
      index: true,
    },
    userType: {
      type: String,
      enum: ['all', 'children', 'elderly', 'pwd', 'pets'],
      default: 'all',
      index: true,
    },
    isRequired: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

PreparednessItemSchema.index({ categoryKey: 1, priority: 1, isActive: 1 });

export const PreparednessItem: Model<IPreparednessItem> =
  mongoose.models.PreparednessItem ||
  mongoose.model<IPreparednessItem>('PreparednessItem', PreparednessItemSchema);
export default PreparednessItem;
