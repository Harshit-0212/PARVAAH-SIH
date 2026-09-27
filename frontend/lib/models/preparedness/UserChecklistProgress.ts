import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IUserChecklistProgress extends Document {
  userId: string;
  itemId: Types.ObjectId;
  checked: boolean;
  updatedAt: Date;
}

const UserChecklistProgressSchema = new Schema<IUserChecklistProgress>(
  {
    userId: { type: String, required: true, index: true },
    itemId: { type: Schema.Types.ObjectId, ref: 'PreparednessItem', required: true },
    checked: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

UserChecklistProgressSchema.index({ userId: 1, itemId: 1 }, { unique: true });

export const UserChecklistProgress: Model<IUserChecklistProgress> =
  mongoose.models.UserChecklistProgress ||
  mongoose.model<IUserChecklistProgress>('UserChecklistProgress', UserChecklistProgressSchema);
export default UserChecklistProgress;
