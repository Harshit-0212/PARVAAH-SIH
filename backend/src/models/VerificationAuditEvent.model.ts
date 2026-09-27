import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVerificationAuditEventDoc extends Document {
  eventId: string;
  reportId: string;
  previousStatus: string;
  newStatus: string;
  changedBy: string;
  changedByRole: string;
  timestamp: Date;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const VerificationAuditEventSchema = new Schema<IVerificationAuditEventDoc>(
  {
    eventId: {
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
    previousStatus: {
      type: String,
      required: true
    },
    newStatus: {
      type: String,
      required: true
    },
    changedBy: {
      type: String,
      required: true
    },
    changedByRole: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true
    },
    notes: {
      type: String,
      maxlength: 1000
    },
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'verification_audit_events'
  }
);

export const VerificationAuditEventModel: Model<IVerificationAuditEventDoc> =
  mongoose.models.VerificationAuditEvent ||
  mongoose.model<IVerificationAuditEventDoc>('VerificationAuditEvent', VerificationAuditEventSchema);
