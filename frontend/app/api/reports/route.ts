import { NextRequest, NextResponse } from 'next/server';
import { createCitizenReport } from '../../../lib/services/reportService';
import { CreateReportInput } from '../../../types/db';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateReportInput;

    // Strict Input Validation
    if (!body.reporterId || !body.districtId || !body.title || !body.description) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error: reporterId, districtId, title, and description are required.',
        },
        { status: 400 }
      );
    }

    if (
      typeof body.longitude !== 'number' ||
      typeof body.latitude !== 'number' ||
      body.longitude < -180 ||
      body.longitude > 180 ||
      body.latitude < -90 ||
      body.latitude > 90
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error: Valid longitude (-180 to 180) and latitude (-90 to 90) are required.',
        },
        { status: 400 }
      );
    }

    const { report, isDuplicate } = await createCitizenReport(body);

    return NextResponse.json(
      {
        success: true,
        message: isDuplicate ? 'Report already received (deduplicated).' : 'Report created successfully.',
        isDuplicate,
        data: report,
      },
      { status: isDuplicate ? 200 : 201 }
    );
  } catch (error: unknown) {
    console.error('API Error [POST /api/reports]:', error);
    const errMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
