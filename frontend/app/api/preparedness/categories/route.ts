import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { PreparednessCategory } from '@/lib/models/preparedness/PreparednessCategory';

export async function GET() {
  try {
    await dbConnect();

    const categories = await PreparednessCategory.find({ isActive: true })
      .sort({ order: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error: any) {
    console.error('Error fetching preparedness categories:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
