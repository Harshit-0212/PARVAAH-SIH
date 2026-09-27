import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { CitizenReportModel, type ICitizenReportDoc, type ReportVerificationStatus } from '../models/CitizenReport.model.js';
import { ReportAttachmentModel } from '../models/ReportAttachment.model.js';
import type { CitizenReportInput, CitizenReportRecord } from '../types/index.js';
import type { ReportQueryDTO, UpdateVerificationDTO } from '../schemas/report.schema.js';
import { connectDatabase, isDatabaseConnected } from '../config/db.js';
import { localMediaStorage } from '../providers/storage/local-media-storage.provider.js';
import { reportStorage } from '../providers/storage/report-storage.provider.js';
import { resolveLocation } from '../utils/geo.js';
import { logger } from '../utils/logger.js';

// Seed demo reports in memory as baseline if database is empty or fallback is needed
const DEMO_BASE_REPORTS: Array<Partial<CitizenReportRecord>> = [
  {
    serverReportId: 'REP-DEMO-001',
    clientReportId: 'CLI-DEMO-001',
    hazardType: 'LANDSLIDE',
    description: 'Fresh minor rockfall along NH-10 near Rangpo corridor. Single lane compromised.',
    district: 'east_sikkim',
    state: 'Sikkim',
    latitude: 27.1767,
    longitude: 88.5312,
    roadCondition: 'PARTIALLY_BLOCKED',
    numberOfPeopleAffected: 12,
    reporterRole: 'citizen',
    status: 'UNDER_VERIFICATION',
    verificationStatus: 'UNDER_VERIFICATION',
    receivedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    source: 'CITIZEN_REPORT_INGESTION',
    isDemo: true,
    isLive: false,
    dataFreshness: 'FRESH'
  },
  {
    serverReportId: 'REP-DEMO-002',
    clientReportId: 'CLI-DEMO-002',
    hazardType: 'SLOPE_CRACK',
    description: 'Ground tension crack observed uphill above village footpath. Creep approx 15mm.',
    district: 'north_sikkim',
    state: 'Sikkim',
    latitude: 27.5022,
    longitude: 88.6189,
    roadCondition: 'OPEN',
    numberOfPeopleAffected: 45,
    reporterRole: 'field_officer',
    status: 'UNDER_VERIFICATION',
    verificationStatus: 'UNDER_VERIFICATION',
    receivedAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    source: 'FIELD_OBSERVER_APP',
    isDemo: true,
    isLive: false,
    dataFreshness: 'FRESH'
  }
];

export class ReportsService {
  private hasSeeded = false;

  private async ensureDb(): Promise<void> {
    if (!isDatabaseConnected() && mongoose.connection.readyState !== 1) {
      await connectDatabase();
    }
  }

  private async seedInitialReportsIfEmpty(): Promise<void> {
    if (this.hasSeeded) return;
    try {
      if (mongoose.connection.readyState === 1) {
        const count = await CitizenReportModel.countDocuments();
        if (count === 0) {
          for (const raw of DEMO_BASE_REPORTS) {
            await CitizenReportModel.create({
              ...raw,
              location: {
                type: 'Point',
                coordinates: [raw.longitude!, raw.latitude!]
              },
              captureTimestamp: new Date(),
              receivedAt: raw.receivedAt ? new Date(raw.receivedAt) : new Date()
            });
          }
          logger.info(`Seeded ${DEMO_BASE_REPORTS.length} baseline demo reports into MongoDB.`);
        }
        this.hasSeeded = true;
      }
    } catch (seedErr: any) {
      logger.warn('Error checking/seeding initial demo reports:', seedErr.message);
    }
  }

  /**
   * Determine district name from coordinates if not provided.
   */
  private inferDistrict(lat: number, lng: number, providedDistrict?: string): string {
    if (providedDistrict && providedDistrict !== 'all' && providedDistrict.trim() !== '') {
      return providedDistrict.trim().toLowerCase();
    }

    // Heuristic bounding box for Sikkim / Eastern Himalayas
    if (lat >= 27.4 && lat <= 28.1 && lng >= 88.3 && lng <= 88.9) return 'north_sikkim';
    if (lat >= 27.1 && lat <= 27.5 && lng >= 88.4 && lng <= 88.9) return 'east_sikkim';
    if (lat >= 27.0 && lat <= 27.4 && lng >= 88.0 && lng <= 88.4) return 'west_sikkim';
    if (lat >= 27.0 && lat <= 27.3 && lng >= 88.3 && lng <= 88.6) return 'south_sikkim';
    if (lat >= 26.0 && lat <= 26.5 && lng >= 91.5 && lng <= 92.2) return 'kamrup';
    if (lat >= 25.0 && lat <= 25.7 && lng >= 92.5 && lng <= 93.3) return 'dima_hasao';

    return 'east_sikkim';
  }

  /**
   * Masks sensitive contact info for privacy compliance
   */
  private sanitizeReport(doc: any): CitizenReportRecord {
    const r = typeof doc.toObject === 'function' ? doc.toObject() : doc;
    const lat = r.latitude ?? (r.location?.coordinates ? r.location.coordinates[1] : 27.1767);
    const lng = r.longitude ?? (r.location?.coordinates ? r.location.coordinates[0] : 88.5312);

    const rawAttachments = (r.attachments && r.attachments.length > 0)
      ? r.attachments
      : (r.attachmentMetadata && r.attachmentMetadata.length > 0)
      ? r.attachmentMetadata
      : [];

    const attachmentMetadata = rawAttachments.map((att: any) => {
      const id = att.attachmentId || att.id || att._id || `ATT-${Date.now()}`;
      const rawType = (att.mediaType || 'photo').toString().toUpperCase();
      const mediaType = (rawType === 'VIDEO' || rawType === 'MOVIE') ? 'VIDEO' : 'IMAGE';
      const mimeType = att.mimeType || (mediaType === 'VIDEO' ? 'video/mp4' : 'image/jpeg');
      const byteSize = att.sizeBytes || att.byteSize || att.fileSizeBytes || 0;
      const sha256 = att.sha256Hash || att.sha256 || 'SERVER_GENERATED_INTEGRITY_HASH';
      const servingUrl = att.servingUrl || `/api/v1/reports/${r.serverReportId}/media/${id}`;

      return {
        id,
        attachmentId: id,
        originalFilename: att.originalFilename || att.fileName || 'evidence_file',
        mediaType,
        mimeType,
        byteSize,
        sizeBytes: byteSize,
        sha256,
        sha256Hash: sha256,
        storageProvider: att.storageProvider || 'LOCAL_FILESYSTEM',
        storageKey: att.storageKey || `${id}`,
        uploadStatus: att.uploadStatus || 'COMPLETED',
        uploadedAt: att.uploadedAt ? new Date(att.uploadedAt).toISOString() : new Date().toISOString(),
        hasPreview: true,
        servingUrl
      };
    });

    const locRes = resolveLocation(lat, lng, r.district, r.state);
    const qualityFlags = Array.from(new Set([...(r.qualityFlags || []), ...(locRes.qualityFlags || [])]));
    const locationResolutionStatus = r.locationResolutionStatus || locRes.locationResolutionStatus;
    const effectiveDistrict = (r.district && r.district !== 'east_sikkim' && r.district !== 'UNRESOLVED')
      ? r.district
      : locRes.district;

    return {
      serverReportId: r.serverReportId,
      id: r.serverReportId,
      clientReportId: r.clientReportId,
      hazardType: r.hazardType,
      description: r.description,
      district: effectiveDistrict,
      state: r.state || locRes.state,
      coordinates: {
        latitude: lat,
        longitude: lng
      },
      latitude: lat,
      longitude: lng,
      locationResolutionStatus: locationResolutionStatus as any,
      qualityFlags,
      userWarning: locRes.userWarning,
      roadCondition: r.roadCondition || 'UNKNOWN',
      numberOfPeopleAffected: r.numberOfPeopleAffected || 0,
      contactNumber: r.contactNumber
        ? r.contactNumber.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')
        : undefined,
      reporterRole: r.reporterRole || 'citizen',
      status: r.status || 'UNDER_VERIFICATION',
      verificationStatus: r.verificationStatus || 'UNDER_VERIFICATION',
      verifiedBy: r.verifiedBy,
      verifiedAt: r.verifiedAt ? new Date(r.verifiedAt).toISOString() : undefined,
      verificationNotes: r.verificationNotes,
      captureTimestamp: r.captureTimestamp ? new Date(r.captureTimestamp).toISOString() : new Date().toISOString(),
      receivedAt: r.receivedAt ? new Date(r.receivedAt).toISOString() : new Date().toISOString(),
      source: r.source || 'CITIZEN_REPORT_INGESTION',
      attachmentMetadata,
      attachments: attachmentMetadata as any,
      isDemo: r.isDemo ?? true,
      isLive: r.isLive ?? false,
      dataFreshness: r.dataFreshness || 'FRESH'
    };
  }

  /**
   * Submit a new citizen or field report with deduplication and MongoDB persistence
   */
  async submitReport(input: CitizenReportInput & { attachmentFiles?: Array<{ fieldName: string; originalFilename: string; mimeType: string; buffer: Buffer }> }): Promise<{
    success: boolean;
    serverReportId: string;
    clientReportId: string;
    verificationStatus: ReportVerificationStatus;
    status: 'UNDER_VERIFICATION';
    isDuplicate: boolean;
    syncStatus: 'SYNCED';
    dataFreshness: 'FRESH';
    createdAt: string;
    message: string;
    data: CitizenReportRecord;
  }> {
    await this.ensureDb();
    await this.seedInitialReportsIfEmpty();

    const locRes = resolveLocation(input.latitude, input.longitude, input.district, input.state);

    if (mongoose.connection.readyState === 1) {
      const existing = await CitizenReportModel.findOne({ clientReportId: input.clientReportId });
      if (existing) {
        logger.info(`Deduplication triggered: clientReportId '${input.clientReportId}' already exists in MongoDB.`);
        const sanitized = this.sanitizeReport(existing);
        return {
          success: true,
          serverReportId: existing.serverReportId,
          clientReportId: existing.clientReportId,
          verificationStatus: existing.verificationStatus,
          status: 'UNDER_VERIFICATION',
          isDuplicate: true,
          syncStatus: 'SYNCED',
          dataFreshness: 'FRESH',
          createdAt: existing.createdAt.toISOString(),
          message: 'Report already recorded previously via offline sync queue.',
          data: sanitized
        };
      }
    } else {
      const inMemoryExisting = await reportStorage.getReportByClientId(input.clientReportId);
      if (inMemoryExisting) {
        return {
          success: true,
          serverReportId: inMemoryExisting.serverReportId,
          clientReportId: inMemoryExisting.clientReportId,
          verificationStatus: inMemoryExisting.verificationStatus || 'UNDER_VERIFICATION',
          status: 'UNDER_VERIFICATION',
          isDuplicate: true,
          syncStatus: 'SYNCED',
          dataFreshness: 'FRESH',
          createdAt: new Date().toISOString(),
          message: 'Report already recorded in the active IN_MEMORY_FALLBACK store.',
          data: inMemoryExisting
        };
      }
    }

    // 2. Generate unique server report ID
    const serverReportId = `REP-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const reportDocData: any = {
      clientReportId: input.clientReportId,
      serverReportId,
      hazardType: input.hazardType,
      description: input.description,
      district: locRes.district,
      state: locRes.state,
      locationResolutionStatus: locRes.locationResolutionStatus,
      qualityFlags: locRes.qualityFlags,
      location: {
        type: 'Point' as const,
        coordinates: [input.longitude, input.latitude] as [number, number]
      },
      latitude: input.latitude,
      longitude: input.longitude,
      roadCondition: input.roadCondition || 'UNKNOWN',
      numberOfPeopleAffected: input.numberOfPeopleAffected || 0,
      contactNumber: input.contactNumber,
      reporterRole: input.reporterRole || 'citizen',
      status: 'UNDER_VERIFICATION',
      verificationStatus: 'UNDER_VERIFICATION',
      captureTimestamp: input.captureTimestamp ? new Date(input.captureTimestamp) : new Date(),
      receivedAt: new Date(),
      source: 'CITIZEN_REPORT_INGESTION',
      isDemo: true,
      isLive: false,
      dataFreshness: 'FRESH'
    };

    try {
      let savedDoc: ICitizenReportDoc | null = null;
      let fallbackRecord: CitizenReportRecord | null = null;

      if (mongoose.connection.readyState === 1) {
        savedDoc = await CitizenReportModel.create(reportDocData);
        logger.info(`✅ Citizen report ${serverReportId} successfully persisted to MongoDB Atlas/local!`);
      } else {
        const stored = await reportStorage.saveReport({
          clientReportId: input.clientReportId,
          hazardType: input.hazardType,
          description: input.description,
          latitude: input.latitude,
          longitude: input.longitude,
          district: locRes.district,
          state: locRes.state,
          roadCondition: input.roadCondition || 'UNKNOWN',
          numberOfPeopleAffected: input.numberOfPeopleAffected || 0,
          contactNumber: input.contactNumber,
          reporterRole: input.reporterRole || 'citizen',
          captureTimestamp: input.captureTimestamp || new Date().toISOString(),
          attachmentMetadata: input.attachmentMetadata || []
        });
        fallbackRecord = stored.report;
        logger.info(`⚠️ Citizen report ${serverReportId} stored in IN_MEMORY_FALLBACK repository.`);
      }

      const attachmentFiles = input.attachmentFiles || [];
      const savedAttachments: any[] = [];

      if (attachmentFiles.length > 0) {
        for (const file of attachmentFiles) {
          if (!file || !file.buffer || file.buffer.length === 0) continue;

          const stored = await localMediaStorage.saveMedia({
            buffer: file.buffer,
            originalFilename: (file as any).originalFilename || (file as any).originalname || 'attachment.jpg',
            mimeType: (file as any).mimeType || (file as any).mimetype || 'image/jpeg',
            reportId: serverReportId,
            deviceCapturedAt: input.captureTimestamp ? new Date(input.captureTimestamp) : new Date(),
            gpsLatitude: input.latitude,
            gpsLongitude: input.longitude
          });

          const attachmentDoc = await ReportAttachmentModel.create({
            attachmentId: stored.attachmentId,
            reportId: serverReportId,
            originalFilename: stored.originalFilename,
            mediaType: stored.mediaType,
            mimeType: stored.mimeType,
            sizeBytes: stored.sizeBytes,
            sha256Hash: stored.sha256Hash,
            storageProvider: stored.storageProvider,
            storagePath: stored.storagePath,
            storageKey: stored.storageKey,
            deviceCapturedAt: stored.deviceCapturedAt,
            uploadedAt: stored.uploadedAt,
            gpsLatitude: stored.gpsLatitude,
            gpsLongitude: stored.gpsLongitude,
            uploadStatus: stored.uploadStatus,
            virusScanStatus: stored.virusScanStatus,
            servingUrl: stored.servingUrl
          });

          savedAttachments.push({
            id: attachmentDoc.attachmentId,
            attachmentId: attachmentDoc.attachmentId,
            originalFilename: attachmentDoc.originalFilename,
            mediaType: attachmentDoc.mediaType === 'photo' ? 'IMAGE' : attachmentDoc.mediaType.toUpperCase(),
            mimeType: attachmentDoc.mimeType,
            byteSize: attachmentDoc.sizeBytes,
            sizeBytes: attachmentDoc.sizeBytes,
            sha256: attachmentDoc.sha256Hash,
            sha256Hash: attachmentDoc.sha256Hash,
            storageProvider: attachmentDoc.storageProvider,
            storageKey: attachmentDoc.storageKey,
            uploadStatus: 'COMPLETED',
            uploadedAt: attachmentDoc.uploadedAt,
            hasPreview: true,
            servingUrl: attachmentDoc.servingUrl
          });
        }

        const persistedDoc = savedDoc as ICitizenReportDoc | null;
        if (persistedDoc && savedAttachments.length > 0) {
          persistedDoc.attachments = savedAttachments as any;
          persistedDoc.attachmentMetadata = savedAttachments as any;
          persistedDoc.attachmentIds = savedAttachments.map(item => item.attachmentId);
          await persistedDoc.save();
        }
      }

      const sanitized = this.sanitizeReport(savedDoc || fallbackRecord as any);

      return {
        ...sanitized,
        success: true,
        serverReportId,
        clientReportId: input.clientReportId,
        verificationStatus: 'UNDER_VERIFICATION',
        status: 'UNDER_VERIFICATION',
        isDuplicate: false,
        syncStatus: 'SYNCED',
        dataFreshness: 'FRESH',
        createdAt: savedDoc ? (savedDoc.createdAt ? savedDoc.createdAt.toISOString() : new Date().toISOString()) : new Date().toISOString(),
        message: 'Citizen report successfully received and queued under verification.',
        data: sanitized
      };
    } catch (err: any) {
      // Handle MongoDB duplicate key race condition (E11000)
      if (err.code === 11000) {
        const existing = await CitizenReportModel.findOne({ clientReportId: input.clientReportId });
        if (existing) {
          const sanitized = this.sanitizeReport(existing);
          return {
            success: true,
            serverReportId: existing.serverReportId,
            clientReportId: existing.clientReportId,
            verificationStatus: existing.verificationStatus,
            status: 'UNDER_VERIFICATION',
            isDuplicate: true,
            syncStatus: 'SYNCED',
            dataFreshness: 'FRESH',
            createdAt: existing.createdAt.toISOString(),
            message: 'Report already recorded previously via offline sync queue.',
            data: sanitized
          };
        }
      }
      logger.error('Database write error saving citizen report:', err);
      throw new Error(`Database error saving citizen report: ${err.message}`);
    }
  }

  /**
   * Query reports with multi-criteria filtering, pagination, and sorting
   */
  async getReports(query: ReportQueryDTO = { page: 1, limit: 50 }): Promise<{
    reports: CitizenReportRecord[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    await this.ensureDb();
    await this.seedInitialReportsIfEmpty();

    const filter: Record<string, any> = {};

    // 1. Verification status filter
    if (query.verificationStatus && query.verificationStatus !== 'all') {
      const statuses = query.verificationStatus.split(',').map(s => s.trim().toUpperCase());
      filter.verificationStatus = { $in: statuses };
    }

    // 2. Hazard type filter
    if (query.hazardType && query.hazardType !== 'all') {
      filter.hazardType = query.hazardType.toUpperCase();
    }

    // 3. District filter
    if (query.district && query.district !== 'all') {
      filter.district = query.district.toLowerCase();
    }

    // 4. State filter
    if (query.state && query.state !== 'all') {
      filter.state = new RegExp(`^${query.state}$`, 'i');
    }

    // 5. Bounding box filter (format: minLng,minLat,maxLng,maxLat)
    if (query.bbox) {
      const parts = query.bbox.split(',').map(Number);
      if (parts.length === 4 && parts.every(n => !isNaN(n))) {
        const [minLng, minLat, maxLng, maxLat] = parts;
        filter.longitude = { $gte: minLng, $lte: maxLng };
        filter.latitude = { $gte: minLat, $lte: maxLat };
      }
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
    const skip = (page - 1) * limit;

    let total = 0;
    let rawDocs: any[] = [];

    if (mongoose.connection.readyState === 1) {
      total = await CitizenReportModel.countDocuments(filter);
      rawDocs = await CitizenReportModel.find(filter)
        .sort({ receivedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    } else {
      logger.warn('Database offline when querying reports, returning active IN_MEMORY_FALLBACK items.');
      const fallbackDocs = await reportStorage.getAllReports();
      let filtered = fallbackDocs;

      if (query.verificationStatus && query.verificationStatus !== 'all') {
        const statuses = query.verificationStatus.split(',').map(s => s.trim().toUpperCase());
        filtered = filtered.filter(r => statuses.includes((r.verificationStatus || '').toUpperCase()));
      }
      if (query.hazardType && query.hazardType !== 'all') {
        const hazardType = query.hazardType.toUpperCase();
        filtered = filtered.filter(r => (r.hazardType || '').toUpperCase() === hazardType);
      }
      if (query.district && query.district !== 'all') {
        const district = query.district.toLowerCase();
        filtered = filtered.filter(r => (r.district || '').toLowerCase() === district);
      }
      if (query.state && query.state !== 'all') {
        const state = query.state.toLowerCase();
        filtered = filtered.filter(r => (r.state || '').toLowerCase() === state);
      }

      rawDocs = filtered.slice(skip, skip + limit);
      total = filtered.length;
    }

    const reports = rawDocs.map(d => this.sanitizeReport(d));

    return {
      reports,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  /**
   * Get single report by serverReportId or MongoDB _id
   */
  async getReportById(id: string): Promise<CitizenReportRecord | null> {
    await this.ensureDb();
    if (mongoose.connection.readyState === 1) {
      const doc = await CitizenReportModel.findOne({
        $or: [
          { serverReportId: id },
          ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])
        ]
      }).lean();

      if (doc) return this.sanitizeReport(doc);
    }

    const fallback = await reportStorage.getReportByServerId(id);
    if (fallback) return fallback;

    const allFallbackReports = await reportStorage.getAllReports();
    const byClientId = allFallbackReports.find(r => r.clientReportId === id);
    return byClientId || null;
  }

  /**
   * Verify, reject, or mark duplicate with role-based validation
   */
  async updateVerificationStatus(
    id: string,
    update: UpdateVerificationDTO,
    userRole: string = 'field_officer'
  ): Promise<CitizenReportRecord> {
    await this.ensureDb();

    // Verify authorized role
    const normalizedRole = userRole.toLowerCase();
    const authorizedRoles = ['field_officer', 'district_officer', 'admin', 'officer'];
    if (!authorizedRoles.includes(normalizedRole)) {
      const err: any = new Error(`Forbidden: Role '${userRole}' is not authorized to verify citizen reports.`);
      err.statusCode = 403;
      throw err;
    }

    if (mongoose.connection.readyState !== 1) {
      const fallback = await reportStorage.getReportByServerId(id);
      if (!fallback) {
        const err: any = new Error(`Report '${id}' not found.`);
        err.statusCode = 404;
        throw err;
      }

      const updated = {
        ...fallback,
        verificationStatus: update.verificationStatus,
        status: update.verificationStatus === 'VERIFIED' ? 'VERIFIED' : update.verificationStatus === 'REJECTED' ? 'REJECTED' : 'UNDER_VERIFICATION',
        verifiedBy: update.verifiedBy || `${userRole.toUpperCase()} Console`,
        verifiedAt: new Date().toISOString(),
        verificationNotes: update.notes || fallback.verificationNotes
      } as CitizenReportRecord;

      const persisted = await reportStorage.updateReport(id, updated);
      if (!persisted) {
        throw new Error(`Report '${id}' not found in fallback repository.`);
      }

      return persisted;
    }

    const query = {
      $or: [
        { serverReportId: id },
        ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])
      ]
    };

    const existing = await CitizenReportModel.findOne(query);
    if (!existing) {
      const err: any = new Error(`Report '${id}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    existing.verificationStatus = update.verificationStatus;
    existing.status =
      update.verificationStatus === 'VERIFIED'
        ? 'VERIFIED'
        : update.verificationStatus === 'REJECTED'
        ? 'REJECTED'
        : 'UNDER_VERIFICATION';

    existing.verifiedBy = update.verifiedBy || `${userRole.toUpperCase()} Console`;
    existing.verifiedAt = new Date();
    if (update.notes) {
      existing.verificationNotes = update.notes;
    }

    await existing.save();
    logger.info(`Report ${existing.serverReportId} verification status updated to '${update.verificationStatus}' by ${existing.verifiedBy}.`);

    return this.sanitizeReport(existing);
  }
}

export const reportsService = new ReportsService();
