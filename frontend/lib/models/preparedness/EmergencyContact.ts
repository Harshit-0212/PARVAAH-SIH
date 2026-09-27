import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type ContactRole =
  | 'ddma_control_room'
  | 'sdrf_dispatch'
  | 'ndrf_command'
  | 'police_station'
  | 'fire_rescue'
  | 'pwd_roads'
  | 'medical_emergency'
  | 'forest_range';

export interface IEmergencyContact extends Document {
  districtId?: Types.ObjectId;
  title: Record<string, string>;
  phone: string;
  alternatePhone?: string;
  roleType: ContactRole;
  isEmergency: boolean;
  priorityOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmergencyContactSchema = new Schema<IEmergencyContact>(
  {
    districtId: { type: Schema.Types.ObjectId, ref: 'District', index: true },
    title: { type: Map, of: String, required: true },
    phone: { type: String, required: true, trim: true },
    alternatePhone: { type: String, trim: true },
    roleType: {
      type: String,
      enum: [
        'ddma_control_room',
        'sdrf_dispatch',
        'ndrf_command',
        'police_station',
        'fire_rescue',
        'pwd_roads',
        'medical_emergency',
        'forest_range',
      ],
      required: true,
      index: true,
    },
    isEmergency: { type: Boolean, default: true, index: true },
    priorityOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

EmergencyContactSchema.index({ districtId: 1, roleType: 1, isActive: 1 });

export const EmergencyContact: Model<IEmergencyContact> =
  mongoose.models.EmergencyContact ||
  mongoose.model<IEmergencyContact>('EmergencyContact', EmergencyContactSchema);
export default EmergencyContact;
