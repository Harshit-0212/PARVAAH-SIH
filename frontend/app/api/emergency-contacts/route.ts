import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { EmergencyContact } from '@/lib/models/preparedness/EmergencyContact';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const districtId = searchParams.get('districtId');
    const roleType = searchParams.get('roleType');

    const filter: any = { isActive: true };
    if (districtId) {
      filter.$or = [{ districtId }, { districtId: { $exists: false } }];
    }
    if (roleType) {
      filter.roleType = roleType;
    }

    const contacts = await EmergencyContact.find(filter)
      .sort({ priorityOrder: 1, isEmergency: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: contacts.length,
      data: contacts,
    });
  } catch (error: any) {
    console.error('Error fetching emergency contacts:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
