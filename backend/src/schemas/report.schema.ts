import { z } from 'zod';
import { hazardTypeSchema, roadConditionSchema } from './incident.schema.js';

export const verificationStatusSchema = z.enum([
  'UNDER_VERIFICATION',
  'ASSIGNED',
  'VERIFIED',
  'REJECTED',
  'DUPLICATE',
  'RESOLVED',
  'ARCHIVED'
]);

export const createReportSchema = z.object({
  clientReportId: z.string().min(1, 'Client report ID is required for offline sync deduplication'),
  hazardType: hazardTypeSchema,
  description: z.string().min(5, 'Description must be at least 5 characters'),
  latitude: z.coerce.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
  longitude: z.coerce.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
  gpsAccuracy: z.coerce.number().min(0).optional().default(10),
  nearestRoad: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  roadCondition: roadConditionSchema.optional().default('UNKNOWN'),
  numberOfPeopleAffected: z.coerce.number().nonnegative().optional().default(0),
  contactNumber: z.string().max(30).optional(),
  reporterRole: z.enum(['citizen', 'field_officer', 'district_officer', 'admin']).optional().default('citizen'),
  captureTimestamp: z.string().datetime().or(z.string().min(10)).optional(),
  scenarioId: z.string().nullable().optional(),
  attachmentMetadata: z.array(z.object({
    fileName: z.string().max(255),
    fileSizeBytes: z.number().positive(),
    mimeType: z.string().max(100)
  })).optional().default([])
});

export const updateVerificationSchema = z.object({
  verificationStatus: verificationStatusSchema,
  notes: z.string().max(1000).optional(),
  verifiedBy: z.string().max(100).optional()
}).refine(data => {
  if (['VERIFIED', 'REJECTED'].includes(data.verificationStatus)) {
    return Boolean(data.notes && data.notes.trim().length >= 3);
  }
  return true;
}, {
  message: 'A verification note (minimum 3 characters) is required when marking a report as VERIFIED or REJECTED.',
  path: ['notes']
});

export const assignReportSchema = z.object({
  assignedOfficerName: z.string().min(2, 'Assigned officer or team name is required'),
  assignedAgency: z.enum(['PWD', 'SDRF', 'DDMA', 'POLICE', 'FOREST', 'BRO', 'OTHER']).default('DDMA'),
  assignedRole: z.enum(['field_officer', 'district_officer', 'engineer']).default('field_officer'),
  assignedToUserId: z.string().optional(),
  notes: z.string().max(1000).optional()
});

export const reportQuerySchema = z.object({
  verificationStatus: z.string().optional(),
  hazardType: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  bbox: z.string().optional(), // format: minLng,minLat,maxLng,maxLat
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50)
});

export type CreateReportDTO = z.infer<typeof createReportSchema>;
export type UpdateVerificationDTO = z.infer<typeof updateVerificationSchema>;
export type AssignReportDTO = z.infer<typeof assignReportSchema>;
export type ReportQueryDTO = z.infer<typeof reportQuerySchema>;
