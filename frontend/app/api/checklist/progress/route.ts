import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { UserChecklistProgress } from '@/lib/models/preparedness/UserChecklistProgress';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing required query parameter: userId' }, { status: 400 });
    }

    const progress = await UserChecklistProgress.find({ userId }).lean();

    // Convert to a dictionary of { [itemId]: boolean } for instant client lookup
    const progressMap: Record<string, boolean> = {};
    progress.forEach((p) => {
      progressMap[p.itemId.toString()] = p.checked;
    });

    return NextResponse.json({
      success: true,
      userId,
      progress: progressMap,
    });
  } catch (error: any) {
    console.error('Error fetching checklist progress:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const { userId, itemId, checked } = body;

    if (!userId || !itemId || typeof checked !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid payload. Must include userId, itemId, and checked (boolean).' },
        { status: 400 }
      );
    }

    const updated = await UserChecklistProgress.findOneAndUpdate(
      { userId, itemId },
      { checked, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error('Error saving checklist progress:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
