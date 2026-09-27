import { z } from 'zod';

export const officialEvacuationStatusSchema = z.enum([
  'NO_ADVICE',
  'PREPARE_TO_EVACUATE',
  'VOLUNTARY_EVACUATION_RECOMMENDED',
  'MANDATORY_EVACUATION_ORDERED',
  'SHELTER_IN_PLACE',
  'EVACUATION_COMPLETED',
  'RETURN_NOT_AUTHORIZED',
  'RETURN_AUTHORIZED'
]);

export const evacuationRecommendationSchema = z.enum([
  'NO_ADVICE',
  'ADVISORY',
  'VOLUNTARY',
  'MANDATORY',
  'SHELTER_IN_PLACE'
]);
