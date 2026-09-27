import { z } from 'zod';

export const hazardTypeSchema = z.enum([
  'LANDSLIDE',
  'FLASH_FLOOD',
  'RIVER_FLOOD',
  'CYCLONE',
  'ROAD_BLOCKAGE',
  'BRIDGE_DAMAGE',
  'SLOPE_CRACK',
  'INFRASTRUCTURE_FAILURE'
]);

export const severitySchema = z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']);

export const roadConditionSchema = z.enum(['OPEN', 'PARTIALLY_BLOCKED', 'CLOSED', 'UNKNOWN']);

export const incidentQuerySchema = z.object({
  hazardType: hazardTypeSchema.optional(),
  severity: severitySchema.optional(),
  status: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  bbox: z.string().optional(), // 'minLng,minLat,maxLng,maxLat'
  includeResolved: z.enum(['true', 'false']).optional().transform(v => v === 'true'),
  limit: z.coerce.number().min(1).max(100).optional().default(50)
});
