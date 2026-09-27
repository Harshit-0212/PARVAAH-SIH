import type { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { reportsService } from '../services/reports.service.js';
import {
  createReportSchema,
  reportQuerySchema,
  updateVerificationSchema
} from '../schemas/report.schema.js';
import { ReportAttachmentModel } from '../models/ReportAttachment.model.js';
import { ReportAssignmentModel } from '../models/ReportAssignment.model.js';
import { localMediaStorage } from '../providers/storage/local-media-storage.provider.js';

async function parseMultipartReport(req: Request): Promise<{ fields: Record<string, string>; files: Array<{ fieldName: string; originalFilename: string; mimeType: string; buffer: Buffer }> }> {
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return { fields: {}, files: [] };
  }

  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) {
    throw new Error('Missing multipart form-data boundary.');
  }

  const boundary = `--${boundaryMatch[1] || boundaryMatch[2]}`;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks);
  const sections = rawBody.toString('binary').split(boundary).slice(1, -1);
  const fields: Record<string, string> = {};
  const files: Array<{ fieldName: string; originalFilename: string; mimeType: string; buffer: Buffer }> = [];

  for (const section of sections) {
    const sectionBuffer = Buffer.from(section, 'binary');
    const headerEnd = sectionBuffer.indexOf(Buffer.from('\r\n\r\n'));
    if (headerEnd === -1) continue;

    const headerBlock = sectionBuffer.slice(0, headerEnd).toString('latin1');
    const bodyBuffer = sectionBuffer.slice(headerEnd + 4);
    const payloadBuffer = bodyBuffer.subarray(0, Math.max(0, bodyBuffer.length - 2));

    const dispositionMatch = headerBlock.match(/Content-Disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]*)")?/i);
    if (!dispositionMatch) continue;

    const fieldName = dispositionMatch[1];
    const originalFilename = dispositionMatch[2] || '';
    const mimeMatch = headerBlock.match(/Content-Type:\s*([^\r\n]+)/i);
    const mimeType = mimeMatch ? mimeMatch[1].trim() : 'application/octet-stream';

    if (originalFilename) {
      files.push({
        fieldName,
        originalFilename,
        mimeType,
        buffer: Buffer.from(payloadBuffer)
      });
    } else {
      fields[fieldName] = payloadBuffer.toString('utf8');
    }
  }

  return { fields, files };
}

export class ReportsController {
  /**
   * POST /api/v1/reports
   * Ingests a new citizen or field hazard report.
   * Enforces strict schema validation, idempotency, and MongoDB persistence.
   */
  async submitReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedMultipart = req.headers['content-type']?.includes('multipart/form-data')
        ? await parseMultipartReport(req)
        : { fields: req.body || {}, files: [] };

      const rawPayload = {
        ...parsedMultipart.fields,
        ...(parsedMultipart.files.length > 0 ? {
          attachmentFiles: parsedMultipart.files
        } : {})
      };

      const validatedInput = createReportSchema.parse(rawPayload);
      const result = await reportsService.submitReport({
        ...validatedInput,
        attachmentFiles: parsedMultipart.files
      });

      const statusCode = result.isDuplicate ? 200 : 201;
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.status(statusCode).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/reports
   * Queries reports from MongoDB with multi-criteria filters, pagination, and sorting.
   * Enforces no-store cache control so operational status is always fresh.
   */
  async getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = reportQuerySchema.parse(req.query);
      const { reports, pagination } = await reportsService.getReports(query);

      // Prevent caching of active operational reports
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      res.status(200).json({
        success: true,
        count: reports.length,
        total: pagination.total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: pagination.totalPages,
        dataFreshness: 'FRESH',
        source: 'MONGODB_CITIZEN_REPORTS',
        data: reports
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/reports/:id
   * Retrieves single report by report ID.
   */
  async getReportById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await reportsService.getReportById(req.params.id);

      if (!report) {
        res.status(404).json({
          success: false,
          error: `Report with ID '${req.params.id}' was not found.`
        });
        return;
      }

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.status(200).json({
        success: true,
        data: report
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/reports/:id/verification
   * Updates report verification status (UNDER_VERIFICATION, VERIFIED, REJECTED, DUPLICATE).
   * Restricted to authorized officer roles.
   */
  async updateVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userRole = (req.headers['x-user-role'] as string) || 'field_officer';
      const validatedUpdate = updateVerificationSchema.parse(req.body);

      const updated = await reportsService.updateVerificationStatus(
        req.params.id,
        validatedUpdate,
        userRole
      );

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.status(200).json({
        success: true,
        message: `Report verification status updated to '${validatedUpdate.verificationStatus}'.`,
        data: updated
      });
    } catch (err: any) {
      if (err.statusCode) {
        res.status(err.statusCode).json({
          success: false,
          error: err.message
        });
        return;
      }
      next(err);
    }
  }

  /**
   * GET /api/v1/reports/:id/media/:attachmentId
   * Securely streams binary media (photo/video) for an authorized report attachment.
   * Validates report existence and uses storagePath from ReportAttachment record.
   */
  async serveMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, attachmentId } = req.params;

      // Verify the report exists
      const report = await reportsService.getReportById(id);
      if (!report) {
        res.status(404).json({
          success: false,
          error: `Report '${id}' not found. Cannot serve media.`
        });
        return;
      }

      // Look up the attachment metadata record
      let attachment: any = null;
      if (mongoose.connection.readyState === 1) {
        attachment = await ReportAttachmentModel.findOne({
          $or: [{ attachmentId }, { _id: mongoose.Types.ObjectId.isValid(attachmentId) ? attachmentId : undefined }]
        }).lean();
      }

      if (!attachment) {
        res.status(404).json({
          success: false,
          error: `Attachment '${attachmentId}' not found for report '${id}'.`
        });
        return;
      }

      const media = await localMediaStorage.getMediaStream(attachment.storagePath);
      if (!media) {
        res.status(404).json({
          success: false,
          error: `Media file not found in storage for attachment '${attachmentId}'.`
        });
        return;
      }

      res.setHeader('Content-Type', attachment.mimeType || media.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${attachment.originalFilename}"`);
      res.setHeader('Cache-Control', 'private, max-age=3600');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      media.stream.pipe(res);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/reports/:id/assign
   * Assigns a report to a field officer or response team.
   * Creates a ReportAssignment record and updates the report status.
   */
  async assignReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const {
        assignedOfficerName,
        assignedAgency = 'DDMA',
        assignedRole = 'field_officer',
        assignedBy,
        notes
      } = req.body;

      if (!assignedOfficerName || !assignedBy) {
        res.status(400).json({
          success: false,
          error: 'assignedOfficerName and assignedBy are required fields.'
        });
        return;
      }

      // Verify report exists
      const report = await reportsService.getReportById(id);
      if (!report) {
        res.status(404).json({ success: false, error: `Report '${id}' not found.` });
        return;
      }

      const assignmentId = `ASSIGN-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

      let assignment: any = { assignmentId, reportId: id, assignedOfficerName, assignedAgency, assignedRole, assignedBy, assignedAt: new Date(), status: 'ASSIGNED', notes };

      if (mongoose.connection.readyState === 1) {
        const doc = await ReportAssignmentModel.create(assignment);
        assignment = doc.toObject();
      }

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.status(201).json({
        success: true,
        message: `Report '${id}' assigned to ${assignedOfficerName} (${assignedAgency}).`,
        data: assignment
      });
    } catch (err) {
      next(err);
    }
  }
}

export const reportsController = new ReportsController();

