import { NextRequest, NextResponse } from 'next/server';
import { dispatchEmergencySMS } from '@/lib/services/notificationService';
import { requireRole } from '@/lib/auth/roleGuards';

export async function POST(req: NextRequest) {
  try {
    // Restrict to admins
    await requireRole(['admin']);

    const body = await req.json();
    const { recipientPhones, message, hazardSeverity, districtName } = body;

    if (!Array.isArray(recipientPhones) || recipientPhones.length === 0 || !message) {
      return NextResponse.json(
        { error: 'Invalid payload. Must supply recipientPhones array and message string.' },
        { status: 400 }
      );
    }

    const result = await dispatchEmergencySMS({
      recipientPhones,
      message,
      hazardSeverity: hazardSeverity || 'advisory',
      districtName,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          errorCode: result.errorCode,
          message: result.message,
        },
        { status: result.errorCode === 'CONFIG_MISSING' ? 503 : 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (err: any) {
    const statusCode = err.message?.includes('UNAUTHORIZED') ? 401 : err.message?.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: statusCode }
    );
  }
}
