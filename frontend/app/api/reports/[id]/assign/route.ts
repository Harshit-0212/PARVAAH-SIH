import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { MediaReport } from '@/lib/models/reporting/MediaReport';
import { ReportAssignment } from '@/lib/models/reporting/ReportAssignment';
import { requireRole } from '@/lib/auth/roleGuards';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    // Require district_officer or admin
    await requireRole(['admin', 'officer', 'district_officer']);

    const body = await req.json();
    const { assignedToUserId, assignedRole, assignedTeamType, notes } = body;

    if (!assignedRole || !assignedTeamType) {
      return NextResponse.json(
        { error: 'Missing required assignment fields: assignedRole, assignedTeamType' },
        { status: 400 }
      );
    }

    const report = await MediaReport.findById(id);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    report.taggedTeamType = assignedTeamType;
    if (assignedToUserId) {
      report.taggedOfficialId = assignedToUserId;
    }
    await report.save();

    const assignment = await ReportAssignment.create({
      reportId: report._id,
      assignedToUserId,
      assignedRole,
      assignedTeamType,
      notes,
      assignedAt: new Date(),
      status: 'assigned',
    });

    return NextResponse.json({
      success: true,
      data: assignment,
    });
  } catch (error: any) {
    console.error('Error assigning report:', error);
    const statusCode = error.message?.includes('UNAUTHORIZED') ? 401 : error.message?.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: statusCode }
    );
  }
}
