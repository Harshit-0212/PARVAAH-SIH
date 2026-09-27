import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReportAssignmentDoc extends Document {
  assignmentId: string;
  reportId: string;
  assignedToUserId?: string;
  assignedOfficerName: string;
  assignedAgency: 'PWD' | 'SDRF' | 'DDMA' | 'POLICE' | 'FOREST' | 'BRO' | 'OTHER';
  assignedRole: 'field_officer' | 'district_officer' | 'engineer';
  assignedBy: string;
  assignedAt: Date;
  status: 'ASSIGNED' | 'CLAIMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportAssignmentSchema = new Schema<IReportAssignmentDoc>(
  {
    assignmentId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    reportId: {
      type: String,
      required: true,
      index: true
    },
    assignedToUserId: {
      type: String
    },
    assignedOfficerName: {
      type: String,
      required: true
    },
    assignedAgency: {
      type: String,
      enum: ['PWD', 'SDRF', 'DDMA', 'POLICE', 'FOREST', 'BRO', 'OTHER'],
      default: 'DDMA'
    },
    assignedRole: {
      type: String,
      enum: ['field_officer', 'district_officer', 'engineer'],
      default: 'field_officer'
    },
    assignedBy: {
      type: String,
      required: true
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['ASSIGNED', 'CLAIMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'ASSIGNED'
    },
    notes: {
      type: String,
      maxlength: 1000
    }
  },
  {
    timestamps: true,
    collection: 'report_assignments'
  }
);

export const ReportAssignmentModel: Model<IReportAssignmentDoc> =
  mongoose.models.ReportAssignment || mongoose.model<IReportAssignmentDoc>('ReportAssignment', ReportAssignmentSchema);
