import { NextRequest, NextResponse } from 'next/server';
import { getNearbyIncidents } from '../../../../lib/services/incidentService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lngStr = searchParams.get('lng');
    const latStr = searchParams.get('lat');
    const radiusStr = searchParams.get('radius');

    if (!lngStr || !latStr) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error: Query parameters lng (longitude) and lat (latitude) are required.',
        },
        { status: 400 }
      );
    }

    const lng = parseFloat(lngStr);
    const lat = parseFloat(latStr);
    const radiusMeters = radiusStr ? parseInt(radiusStr, 10) : 5000;

    if (isNaN(lng) || isNaN(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error: Invalid numeric coordinates provided.',
        },
        { status: 400 }
      );
    }

    const incidents = await getNearbyIncidents(lng, lat, radiusMeters);

    return NextResponse.json(
      {
        success: true,
        count: incidents.length,
        radiusMeters,
        data: incidents,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('API Error [GET /api/incidents/nearby]:', error);
    const errMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
