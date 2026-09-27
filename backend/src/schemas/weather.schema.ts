import { z } from 'zod';

export const weatherQuerySchema = z.object({
  district: z.string().optional(),
  state: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional()
});
