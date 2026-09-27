import mongoose, { Schema, Model } from 'mongoose';
import { IUser } from '../../types/db';

const UserSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
    },
    role: {
      type: String,
      enum: {
        values: ['citizen', 'officer', 'admin'],
        message: '{VALUE} is not a valid role',
      },
      default: 'citizen',
      index: true,
    },
    districtId: {
      type: Schema.Types.ObjectId,
      ref: 'District',
      index: true,
    },
    languagePreference: {
      type: String,
      enum: ['en', 'hi', 'as'],
      default: 'en',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ phone: 1, role: 1 });

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
