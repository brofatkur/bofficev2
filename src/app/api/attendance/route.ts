import { NextResponse } from 'next/server';
import { getAttendanceLogs } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const logs = await getAttendanceLogs();
  return NextResponse.json({ success: true, data: logs });
}
