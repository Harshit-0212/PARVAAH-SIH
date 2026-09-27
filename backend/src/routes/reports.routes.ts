import { Router } from 'express';
import { reportsController } from '../controllers/reports.controller.js';

export const reportsRouter = Router();

// Submit citizen or field hazard report
reportsRouter.post('/reports', (req, res, next) => 
  reportsController.submitReport(req, res, next)
);

// Query reports with multi-criteria filters, pagination, and sorting
reportsRouter.get('/reports', (req, res, next) => 
  reportsController.getReports(req, res, next)
);

// Fetch single report by ID
reportsRouter.get('/reports/:id', (req, res, next) => 
  reportsController.getReportById(req, res, next)
);

// Officer verification status workflow
reportsRouter.patch('/reports/:id/verification', (req, res, next) => 
  reportsController.updateVerification(req, res, next)
);

// Secure media file serving — streams stored photo/video binaries with authorization
reportsRouter.get('/reports/:id/media/:attachmentId', (req, res, next) =>
  reportsController.serveMedia(req, res, next)
);

// Assign report to field officer or response team
reportsRouter.post('/reports/:id/assign', (req, res, next) =>
  reportsController.assignReport(req, res, next)
);

