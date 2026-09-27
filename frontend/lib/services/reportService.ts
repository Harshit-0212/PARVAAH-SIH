import dbConnect from '../dbConnect';
import { Report } from '../models/Report';
import { CreateReportInput, IReport } from '../../types/db';
import { Types } from 'mongoose';
import crypto from 'crypto';

/**
 * Generates a deterministic deduplication hash for offline/online report submissions.
 * Hashes: reporterId + title + location (rounded to ~10m precision) + timestamp bucket (10-minute window).
 */
export function generateDedupeHash(
  reporterId: string,
  title: string,
  lng: number,
  lat: number,
  timestampMs?: number
): string {
  const timeBucket = Math.floor((timestampMs || Date.now()) / (10 * 60 * 1000)); // 10-minute window
  const roundedLng = lng.toFixed(4); // ~11m accuracy
  const roundedLat = lat.toFixed(4);

  const rawString = `${reporterId}:${title.toLowerCase().trim()}:${roundedLng}:${roundedLat}:${timeBucket}`;
  return crypto.createHash('sha256').update(rawString).digest('hex');
}

/**
 * Creates a citizen report safely supporting offline sync deduplication.
 * Uses atomic dedupeHash check to prevent double submissions during network reconnects.
 */
export function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 11000;
}

export async function createCitizenReport(input: CreateReportInput): Promise<{
  report: IReport;
  isDuplicate: boolean;
}> {
  await dbConnect();

  const {
    reporterId,
    districtId,
    title,
    description,
    longitude,
    latitude,
    mediaUrls = [],
    clientTempId,
    offlineCreatedAt,
    dedupeHash: clientHash,
  } = input;

  // Generate or use dedupe hash
  const computedHash =
    clientHash ||
    generateDedupeHash(
      reporterId,
      title,
      longitude,
      latitude,
      offlineCreatedAt ? new Date(offlineCreatedAt).getTime() : Date.now()
    );

  // Check if a report with this dedupeHash already exists
  const existingReport = await Report.findOne({ dedupeHash: computedHash }).lean();
  if (existingReport) {
    console.log(`⚠️ Duplicate report submission detected for hash: ${computedHash}`);
    return {
      report: existingReport as unknown as IReport,
      isDuplicate: true,
    };
  }

  // Construct new report document
  const newReport = new Report({
    reporterId: new Types.ObjectId(reporterId),
    districtId: new Types.ObjectId(districtId),
    title,
    description,
    mediaUrls,
    location: {
      type: 'Point',
      coordinates: [longitude, latitude], // Longitude first, Latitude second!
    },
    reportStatus: 'pending_verification',
    clientTempId,
    offlineCreatedAt: offlineCreatedAt ? new Date(offlineCreatedAt) : undefined,
    syncedAt: new Date(),
    dedupeHash: computedHash,
  });

  try {
    const savedReport = await newReport.save();
    return {
      report: savedReport.toObject() as unknown as IReport,
      isDuplicate: false,
    };
  } catch (err: unknown) {
    // Handle race condition duplicate key error (MongoDB E11000)
    if (isDuplicateKeyError(err)) {
      const duplicate = await Report.findOne({ dedupeHash: computedHash }).lean();
      return {
        report: duplicate as unknown as IReport,
        isDuplicate: true,
      };
    }
    throw err;
  }
}
