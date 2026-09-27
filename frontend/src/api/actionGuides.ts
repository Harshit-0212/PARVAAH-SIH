/**
 * Citizen Action Guides API Client
 */

import { apiClient, type ApiFetchOptions } from './client';

export interface ActionGuide {
  hazardType: string;
  hazardTitle: { en: string; hi: string };
  immediateActions: { en: string[]; hi: string[] };
  evacuationTriggers: { en: string[]; hi: string[] };
  emergencyKitChecklist: { en: string[]; hi: string[] };
  whatNotToDo: { en: string[]; hi: string[] };
  afterEventPrecautions: { en: string[]; hi: string[] };
  metadata: {
    lastReviewed: string;
    source: string;
    officialApprovalStatus: string;
    disclaimer: string;
  };
}

export async function fetchActionGuide(
  hazardType: string,
  options?: ApiFetchOptions
): Promise<{ success: boolean; data: ActionGuide }> {
  return apiClient<{ success: boolean; data: ActionGuide }>(
    `/action-guides/${encodeURIComponent(hazardType)}`,
    options
  );
}

export async function fetchAllActionGuides(
  options?: ApiFetchOptions
): Promise<{ success: boolean; data: Record<string, ActionGuide> }> {
  return apiClient<{ success: boolean; data: Record<string, ActionGuide> }>(
    '/action-guides',
    options
  );
}
