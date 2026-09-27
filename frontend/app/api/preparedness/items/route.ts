import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { PreparednessItem } from '@/lib/models/preparedness/PreparednessItem';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const categoryKey = searchParams.get('categoryKey');
    const userType = searchParams.get('userType'); // 'all', 'children', 'elderly', 'pwd', 'pets'
    const priority = searchParams.get('priority'); // 'critical', 'recommended', 'optional'

    const filter: any = { isActive: true };

    if (categoryKey) {
      filter.categoryKey = categoryKey;
    }
    if (userType) {
      filter.userType = { $in: [userType, 'all'] };
    }
    if (priority) {
      filter.priority = priority;
    }

    const items = await PreparednessItem.find(filter)
      .sort({ order: 1, priority: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error: any) {
    console.error('Error fetching preparedness items:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
