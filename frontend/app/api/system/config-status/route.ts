import { NextResponse } from 'next/server';
import { getSystemIntegrationStatus } from '@/lib/config/env';
import { getUserProfile } from '@/lib/auth/roleGuards';

export async function GET() {
  try {
    const user = await getUserProfile();

    // Restricted to system administrators or field officers checking system availability
    if (!user || (user.role !== 'admin' && user.role !== 'officer')) {
      return NextResponse.json(
        { error: 'Access denied: Requires Admin or Officer privileges' },
        { status: 403 }
      );
    }

    const integrations = getSystemIntegrationStatus();

    return NextResponse.json({
      status: 'operational',
      timestamp: new Date().toISOString(),
      integrations,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error checking system config' },
      { status: 500 }
    );
  }
}
