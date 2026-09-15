import { NextResponse } from 'next/server';
import { getAttendanceLogs } from '@/lib/data-store';

export async function GET() {
  const logs = getAttendanceLogs();
  return NextResponse.json({ success: true, data: logs });
}
