import { NextRequest, NextResponse } from 'next/server';
import { getLiveRainfallForPoint } from '@/lib/services/weatherService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lng = parseFloat(searchParams.get('lng') || '');
    const lat = parseFloat(searchParams.get('lat') || '');

    if (isNaN(lng) || isNaN(lat)) {
      return NextResponse.json(
        { error: 'Missing or invalid coordinates. Please provide lng and lat.' },
        { status: 400 }
      );
    }

    const observation = await getLiveRainfallForPoint(lng, lat);

    if (!observation.success) {
      // Graceful degraded response when external API fails or is unconfigured
      return NextResponse.json(
        {
          success: false,
          errorCode: observation.errorCode,
          message: observation.message,
          data: null,
        },
        { status: observation.errorCode === 'CONFIG_MISSING' ? 503 : 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: observation.data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
