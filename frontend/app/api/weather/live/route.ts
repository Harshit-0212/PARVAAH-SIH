import { NextRequest, NextResponse } from 'next/server';
import { getLiveRainfallForPoint } from '@/lib/services/weatherService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    // Default coordinates: Guwahati, Assam if not supplied
    const lng = parseFloat(searchParams.get('lng') || '91.7362');
    const lat = parseFloat(searchParams.get('lat') || '26.1445');

    const result = await getLiveRainfallForPoint(lng, lat);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          errorCode: result.errorCode,
          message: result.message,
          data: null,
        },
        { status: result.errorCode === 'CONFIG_MISSING' ? 503 : 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
