import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { MediaReport } from '@/lib/models/reporting/MediaReport';
import { MediaAsset } from '@/lib/models/reporting/MediaAsset';
import { requireRole } from '@/lib/auth/roleGuards';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Only authorized officers & admins
    const user = await requireRole(['admin', 'officer', 'field_officer', 'district_officer']);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending_verification';
    const districtId = searchParams.get('districtId');
    const incidentType = searchParams.get('incidentType');

    const filter: any = {};
    if (status !== 'all') {
      filter.verificationStatus = status;
    }

    // If user is district officer, restrict to their district unless admin
    if (user.role !== 'admin') {
      if (user.districtId) {
        filter.districtId = user.districtId;
      }
    } else if (districtId) {
      filter.districtId = districtId;
    }

    if (incidentType) {
      filter.incidentType = incidentType;
    }

    const reports = await MediaReport.find(filter)
      .sort({ confidenceScore: -1, createdAt: -1 })
      .limit(100)
      .populate('districtId', 'name stateName')
      .populate('roadId', 'roadName roadCode')
      .populate('reporterId', 'fullName phone role')
      .lean();

    // Fetch primary media asset for each report thumbnail
    const reportIds = reports.map((r) => r._id);
    const assets = await MediaAsset.find({ reportId: { $in: reportIds } }).lean();

    const assetsMap: Record<string, any[]> = {};
    assets.forEach((a) => {
      const repId = a.reportId.toString();
      if (!assetsMap[repId]) assetsMap[repId] = [];
      assetsMap[repId].push(a);
    });

    const enrichedReports = reports.map((r) => ({
      ...r,
      mediaAssets: assetsMap[r._id.toString()] || [],
    }));

    return NextResponse.json({
      success: true,
      count: enrichedReports.length,
      data: enrichedReports,
    });
  } catch (error: any) {
    console.error('Error fetching officer queue:', error);
    const statusCode = error.message?.includes('UNAUTHORIZED') ? 401 : error.message?.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: statusCode }
    );
  }
}
