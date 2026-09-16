import { NextRequest, NextResponse } from 'next/server';
import { getAttendeeByPhone, getActiveAttendanceByPhone } from '@/lib/data-store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone');

  if (!phone) {
    return NextResponse.json({ success: false, error: 'Nomor HP required' }, { status: 400 });
  }

  const attendee = await getAttendeeByPhone(phone);
  const activeLog = await getActiveAttendanceByPhone(phone);

  return NextResponse.json({
    success: true,
    data: {
      found: Boolean(attendee),
      attendee: attendee || null,
      activeLog: activeLog || null,
    },
  });
}
