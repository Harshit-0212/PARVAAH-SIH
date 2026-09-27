import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { EvacuationGuide } from '@/lib/models/preparedness/EvacuationGuide';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const districtId = searchParams.get('districtId');

    const filter: any = { isActive: true };
    if (districtId) {
      filter.$or = [{ districtId }, { districtId: { $exists: false } }];
    }

    const guides = await EvacuationGuide.find(filter).lean();

    return NextResponse.json({
      success: true,
      count: guides.length,
      data: guides,
    });
  } catch (error: any) {
    console.error('Error fetching evacuation guides:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
