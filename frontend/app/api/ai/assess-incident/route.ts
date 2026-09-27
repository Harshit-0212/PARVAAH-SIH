import { NextRequest, NextResponse } from 'next/server';
import { assessIncidentWithAI } from '@/lib/services/geminiService';
import { getUserProfile } from '@/lib/auth/roleGuards';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserProfile();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { incidentType, description, rainfallMm24h, roadName } = body;

    if (!incidentType || !description) {
      return NextResponse.json(
        { error: 'Missing required parameters: incidentType, description' },
        { status: 400 }
      );
    }

    const assessment = await assessIncidentWithAI(incidentType, description, rainfallMm24h, roadName);

    if (!assessment.success) {
      return NextResponse.json(
        {
          success: false,
          errorCode: assessment.errorCode,
          message: assessment.message,
        },
        { status: assessment.errorCode === 'CONFIG_MISSING' ? 503 : 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: assessment.data,
    });
  } catch (err: any) {
    console.error('API Error in /api/ai/assess-incident:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
