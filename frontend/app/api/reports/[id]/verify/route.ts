import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { MediaReport } from '@/lib/models/reporting/MediaReport';
import { ReportVerification } from '@/lib/models/reporting/ReportVerification';
import { requireRole } from '@/lib/auth/roleGuards';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    // Enforce officer / admin role
    const user = await requireRole(['admin', 'officer', 'field_officer', 'district_officer']);

    const body = await req.json();
    const { decision, notes, confidenceAdjustment } = body;

    const validDecisions = ['verify', 'reject', 'escalate', 'mark_duplicate', 'request_info'];
    if (!validDecisions.includes(decision) || !notes) {
      return NextResponse.json(
        { error: 'Invalid decision or missing notes. Must provide decision and notes.' },
        { status: 400 }
      );
    }

    // Map decision to report verificationStatus
    let nextStatus = 'under_review';
    if (decision === 'verify') nextStatus = 'verified';
    else if (decision === 'reject') nextStatus = 'rejected';
    else if (decision === 'escalate') nextStatus = 'escalated';
    else if (decision === 'mark_duplicate') nextStatus = 'duplicate';

    // Update Report
    const report = await MediaReport.findById(id);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    report.verificationStatus = nextStatus as any;
    if (typeof confidenceAdjustment === 'number') {
      report.confidenceScore = Math.max(0, Math.min(100, report.confidenceScore + confidenceAdjustment));
    }
    await report.save();

    // Log Verification Event
    const verificationLog = await ReportVerification.create({
      reportId: report._id,
      reviewedBy: (user as any)._id,
      decision,
      notes,
      confidenceAdjustment: confidenceAdjustment || 0,
      reviewedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: {
        reportId: report._id,
        newStatus: report.verificationStatus,
        confidenceScore: report.confidenceScore,
        verificationLog,
      },
    });
  } catch (error: any) {
    console.error('Error verifying report:', error);
    const statusCode = error.message?.includes('UNAUTHORIZED') ? 401 : error.message?.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: statusCode }
    );
  }
}
