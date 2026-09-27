import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { MediaReport } from '@/lib/models/reporting/MediaReport';
import { MediaAsset } from '@/lib/models/reporting/MediaAsset';
import { ReportVerification } from '@/lib/models/reporting/ReportVerification';
import { ReportAssignment } from '@/lib/models/reporting/ReportAssignment';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const report = await MediaReport.findById(id)
      .populate('districtId', 'name stateName')
      .populate('roadId', 'roadName roadCode category')
      .populate('reporterId', 'fullName phone role')
      .lean();

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const [assets, verifications, assignments] = await Promise.all([
      MediaAsset.find({ reportId: id }).lean(),
      ReportVerification.find({ reportId: id }).sort({ reviewedAt: -1 }).lean(),
      ReportAssignment.find({ reportId: id }).sort({ assignedAt: -1 }).lean(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...report,
        mediaAssets: assets,
        verifications,
        assignments,
      },
    });
  } catch (error: any) {
    console.error('Error fetching report by ID:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
