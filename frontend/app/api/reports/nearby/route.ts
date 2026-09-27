import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { MediaReport } from '@/lib/models/reporting/MediaReport';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const lng = parseFloat(searchParams.get('lng') || '');
    const lat = parseFloat(searchParams.get('lat') || '');
    const radiusMeters = parseInt(searchParams.get('radiusMeters') || '5000', 10);
    const status = searchParams.get('status');

    if (isNaN(lng) || isNaN(lat)) {
      return NextResponse.json(
        { error: 'Missing or invalid coordinates. Query parameters lng and lat are required.' },
        { status: 400 }
      );
    }

    const filter: any = {
      location: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: radiusMeters,
        },
      },
    };

    if (status) {
      filter.verificationStatus = status;
    } else {
      filter.verificationStatus = { $in: ['verified', 'pending_verification', 'under_review', 'escalated'] };
    }

    const reports = await MediaReport.find(filter)
      .limit(50)
      .populate('districtId', 'name')
      .populate('roadId', 'roadName roadCode')
      .lean();

    // Convert into standardized GeoJSON FeatureCollection for Mapbox / Leaflet
    const featureCollection = {
      type: 'FeatureCollection',
      features: reports.map((r: any) => ({
        type: 'Feature',
        geometry: r.location,
        properties: {
          id: r._id,
          incidentType: r.incidentType,
          description: r.description,
          verificationStatus: r.verificationStatus,
          confidenceScore: r.confidenceScore,
          district: r.districtId?.name,
          road: r.roadId ? `${r.roadId.roadCode || ''} ${r.roadId.roadName}`.trim() : null,
          capturedAt: r.capturedAt,
        },
      })),
    };

    return NextResponse.json({
      success: true,
      count: reports.length,
      data: featureCollection,
    });
  } catch (error: any) {
    console.error('Error in nearby reports:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
