import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IReportAssignment extends Document {
  reportId: Types.ObjectId;
  assignedToUserId?: Types.ObjectId;
  assignedRole: 'field_officer' | 'district_officer' | 'engineer';
  assignedTeamType: 'pwd' | 'sdrf' | 'ddma' | 'police' | 'forest';
  assignedAt: Date;
  status: 'assigned' | 'acknowledged' | 'in_progress' | 'completed';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportAssignmentSchema = new Schema<IReportAssignment>(
  {
    reportId: { type: Schema.Types.ObjectId, ref: 'MediaReport', required: true, index: true },
    assignedToUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    assignedRole: {
      type: String,
      enum: ['field_officer', 'district_officer', 'engineer'],
      required: true,
    },
    assignedTeamType: {
      type: String,
      enum: ['pwd', 'sdrf', 'ddma', 'police', 'forest'],
      required: true,
    },
    assignedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['assigned', 'acknowledged', 'in_progress', 'completed'],
      default: 'assigned',
    },
    notes: { type: String },
  },
  { timestamps: true }
);

export const ReportAssignment: Model<IReportAssignment> =
  mongoose.models.ReportAssignment ||
  mongoose.model<IReportAssignment>('ReportAssignment', ReportAssignmentSchema);
export default ReportAssignment;
