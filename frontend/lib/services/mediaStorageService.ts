import { env } from '../config/env';
import { ServiceResult } from './weatherService';
import crypto from 'crypto';

export interface PresignedUploadResult {
  uploadUrl: string;
  storagePath: string;
  publicUrl?: string;
  storageProvider: 's3' | 'cloudinary' | 'local';
  fields?: Record<string, string>;
}

/**
 * Generates direct-to-cloud presigned upload parameters.
 * Keeps media blobs out of MongoDB and Next.js server memory.
 */
export async function generatePresignedUploadUrl(
  filename: string,
  mimeType: string,
  sizeBytes: number
): Promise<ServiceResult<PresignedUploadResult>> {
  // Validate MIME types
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime',
  ];

  if (!allowedMimeTypes.includes(mimeType)) {
    return {
      success: false,
      errorCode: 'PROVIDER_ERROR',
      message: `Unsupported media type: ${mimeType}. Allowed: JPEG, PNG, WEBP, MP4, MOV`,
    };
  }

  // Max 15MB for images, 60MB for videos
  const maxBytes = mimeType.startsWith('video/') ? 60 * 1024 * 1024 : 15 * 1024 * 1024;
  if (sizeBytes > maxBytes) {
    return {
      success: false,
      errorCode: 'PROVIDER_ERROR',
      message: `File size exceeds allowed limit of ${maxBytes / (1024 * 1024)}MB.`,
    };
  }

  const extension = filename.split('.').pop() || 'dat';
  const yearMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-09"
  const randomKey = crypto.randomUUID();
  const storagePath = `incidents/${yearMonth}/${randomKey}.${extension}`;

  // If S3 credentials are set
  if (env.STORAGE_PROVIDER === 's3' && env.STORAGE_S3_BUCKET && env.STORAGE_S3_ACCESS_KEY) {
    const uploadUrl = `${env.STORAGE_S3_ENDPOINT || `https://${env.STORAGE_S3_BUCKET}.s3.${env.STORAGE_S3_REGION}.amazonaws.com`}/${storagePath}`;
    const publicUrl = env.STORAGE_CDN_URL
      ? `${env.STORAGE_CDN_URL}/${storagePath}`
      : uploadUrl;

    return {
      success: true,
      data: {
        uploadUrl,
        storagePath,
        publicUrl,
        storageProvider: 's3',
      },
    };
  }

  // Fallback to local storage route handler for development
  return {
    success: true,
    data: {
      uploadUrl: `/api/reports/media/direct-upload?path=${encodeURIComponent(storagePath)}`,
      storagePath,
      publicUrl: `/uploads/${storagePath}`,
      storageProvider: 'local',
    },
  };
}
