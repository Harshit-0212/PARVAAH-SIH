import { NextRequest, NextResponse } from 'next/server';
import { createCitizenReport } from '../../../../lib/services/reportService';
import { CreateReportInput } from '../../../../types/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Accept single report or array of reports queued offline
    const reportsToSync: CreateReportInput[] = Array.isArray(body) ? body : [body];

    if (reportsToSync.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Validation Error: Sync batch cannot be empty.' },
        { status: 400 }
      );
    }

    const results = [];
    let syncedCount = 0;
    let duplicatesCount = 0;

    for (const reportItem of reportsToSync) {
      try {
        const { report, isDuplicate } = await createCitizenReport(reportItem);
        if (isDuplicate) {
          duplicatesCount++;
        } else {
          syncedCount++;
        }
        results.push({
          clientTempId: reportItem.clientTempId,
          serverId: report._id,
          isDuplicate,
          status: 'success',
        });
      } catch (err: unknown) {
        const errMessage = err instanceof Error ? err.message : 'Failed to ingest offline report';
        results.push({
          clientTempId: reportItem.clientTempId,
          status: 'error',
          error: errMessage,
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        totalSubmitted: reportsToSync.length,
        syncedCount,
        duplicatesCount,
        results,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('API Error [POST /api/sync/report]:', error);
    const errMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
