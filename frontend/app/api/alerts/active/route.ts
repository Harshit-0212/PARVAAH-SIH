import { NextRequest, NextResponse } from 'next/server';
import { getActiveAlertsByDistrict } from '../../../../lib/services/alertService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const districtId = searchParams.get('districtId');

    if (!districtId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error: Query parameter districtId is required.',
        },
        { status: 400 }
      );
    }

    const alerts = await getActiveAlertsByDistrict(districtId);

    return NextResponse.json(
      {
        success: true,
        count: alerts.length,
        data: alerts,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('API Error [GET /api/alerts/active]:', error);
    const errMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
