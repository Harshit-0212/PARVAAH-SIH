import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { SafetyGuide } from '@/lib/models/preparedness/SafetyGuide';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const hazardType = searchParams.get('hazardType'); // landslide, debris_flow, etc.
    const guideType = searchParams.get('guideType'); // what_to_do, what_not_to_do, danger_zone_protocol

    const filter: any = { isActive: true };
    if (hazardType) filter.hazardType = hazardType;
    if (guideType) filter.guideType = guideType;

    const guides = await SafetyGuide.find(filter)
      .sort({ priority: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: guides.length,
      data: guides,
    });
  } catch (error: any) {
    console.error('Error fetching safety guides:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
