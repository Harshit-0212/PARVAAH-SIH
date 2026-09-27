import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IReportVerification extends Document {
  reportId: Types.ObjectId;
  reviewedBy: Types.ObjectId;
  decision: 'verify' | 'reject' | 'escalate' | 'mark_duplicate' | 'request_info';
  notes: string;
  confidenceAdjustment: number;
  reviewedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReportVerificationSchema = new Schema<IReportVerification>(
  {
    reportId: { type: Schema.Types.ObjectId, ref: 'MediaReport', required: true, index: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    decision: {
      type: String,
      enum: ['verify', 'reject', 'escalate', 'mark_duplicate', 'request_info'],
      required: true,
    },
    notes: { type: String, required: true },
    confidenceAdjustment: { type: Number, default: 0 },
    reviewedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const ReportVerification: Model<IReportVerification> =
  mongoose.models.ReportVerification ||
  mongoose.model<IReportVerification>('ReportVerification', ReportVerificationSchema);
export default ReportVerification;
