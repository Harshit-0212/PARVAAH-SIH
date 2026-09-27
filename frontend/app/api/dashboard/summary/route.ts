import { NextRequest, NextResponse } from 'next/server';
import { getDashboardSummary } from '../../../../lib/services/dashboardService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const districtId = searchParams.get('districtId');

    if (!districtId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error: Query parameter districtId (or district code) is required.',
        },
        { status: 400 }
      );
    }

    const summary = await getDashboardSummary(districtId);

    if (!summary.district) {
      return NextResponse.json(
        {
          success: false,
          error: `District not found for identifier: ${districtId}`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: summary,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('API Error [GET /api/dashboard/summary]:', error);
    const errMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
