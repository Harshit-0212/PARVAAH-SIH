/**
 * Citizen & Field Reports API Client
 */

import { apiClient, type ApiFetchOptions } from './client';
import type { CitizenReportRecord, ApiResponse } from '../types';

export interface SubmitReportPayload {
  clientReportId: string;
  hazardType: string;
  description: string;
  latitude: number;
  longitude: number;
  district?: string;
  state?: string;
  roadCondition?: string;
  numberOfPeopleAffected?: number;
  contactNumber?: string;
  reporterRole?: string;
  captureTimestamp: string;
  attachmentMetadata?: any[];
}

export interface SubmitReportResult {
  success: boolean;
  serverReportId: string;
  clientReportId: string;
  status: string;
  verificationStatus: string;
  isDuplicate: boolean;
  syncStatus: string;
  message: string;
  createdAt: string;
  data?: CitizenReportRecord;
}

export interface ReportFilterOptions {
  district?: string;
  verificationStatus?: string;
  hazardType?: string;
  state?: string;
  bbox?: string;
  page?: number;
  limit?: number;
}

export interface ReportVerificationUpdatePayload {
  verificationStatus: 'UNDER_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'DUPLICATE';
  notes?: string;
  verifiedBy?: string;
}

/**
 * Fetch citizen and field reports with rich filtering and pagination
 */
export async function fetchCitizenReports(
  filters?: string | ReportFilterOptions,
  options?: ApiFetchOptions
): Promise<ApiResponse<CitizenReportRecord[]>> {
  let queryParams = new URLSearchParams();

  if (typeof filters === 'string') {
    if (filters && filters !== 'all') {
      queryParams.set('district', filters);
    }
  } else if (filters) {
    if (filters.district && filters.district !== 'all') queryParams.set('district', filters.district);
    if (filters.verificationStatus && filters.verificationStatus !== 'all') {
      queryParams.set('verificationStatus', filters.verificationStatus);
    }
    if (filters.hazardType && filters.hazardType !== 'all') queryParams.set('hazardType', filters.hazardType);
    if (filters.state && filters.state !== 'all') queryParams.set('state', filters.state);
    if (filters.bbox) queryParams.set('bbox', filters.bbox);
    if (filters.page) queryParams.set('page', String(filters.page));
    if (filters.limit) queryParams.set('limit', String(filters.limit));
  }

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return apiClient<ApiResponse<CitizenReportRecord[]>>(`/reports${queryString}`, {
    ...options,
    headers: {
      'Cache-Control': 'no-cache',
      ...(options?.headers || {})
    }
  });
}

/**
 * Submit a citizen hazard report
 */
export async function submitCitizenReport(
  payload: SubmitReportPayload | FormData,
  options?: ApiFetchOptions
): Promise<SubmitReportResult> {
  const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;

  return apiClient<SubmitReportResult>('/reports', {
    ...options,
    method: 'POST',
    headers: isFormData
      ? {
          Accept: 'application/json',
          ...(options?.headers || {})
        }
      : {
          'Content-Type': 'application/json',
          ...(options?.headers || {})
        },
    body: isFormData ? payload : JSON.stringify(payload)
  });
}

/**
 * Fetch single report by ID
 */
export async function fetchCitizenReportById(
  reportId: string,
  options?: ApiFetchOptions
): Promise<ApiResponse<CitizenReportRecord>> {
  return apiClient<ApiResponse<CitizenReportRecord>>(`/reports/${encodeURIComponent(reportId)}`, options);
}

/**
 * Update verification status (Field Officer / District Officer / Admin only)
 */
export async function updateReportVerification(
  reportId: string,
  payload: ReportVerificationUpdatePayload,
  userRole: string = 'field_officer',
  options?: ApiFetchOptions
): Promise<ApiResponse<CitizenReportRecord>> {
  return apiClient<ApiResponse<CitizenReportRecord>>(`/reports/${encodeURIComponent(reportId)}/verification`, {
    ...options,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': userRole,
      ...(options?.headers || {})
    },
    body: JSON.stringify(payload)
  });
}
