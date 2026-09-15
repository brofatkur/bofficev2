import { NextRequest, NextResponse } from 'next/server';
import { getBookings, addBooking, deleteBooking, getCustomerMonthlyMeetingUsage } from '@/lib/data-store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get('customerId');
  const yearMonth = searchParams.get('yearMonth');

  if (customerId && yearMonth) {
    const usage = getCustomerMonthlyMeetingUsage(customerId, yearMonth);
    return NextResponse.json({ success: true, data: { bookings: getBookings().filter(b => b.customerId === customerId), usage } });
  }

  const bookings = getBookings();
  return NextResponse.json({ success: true, data: bookings });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId, customerId, title, date, startTime, endTime } = body;

    if (!roomId || !customerId || !title || !date || !startTime || !endTime) {
      return NextResponse.json({ success: false, error: 'Semua kolom booking wajib diisi' }, { status: 400 });
    }

    // Calculate duration in hours
    const startH = parseInt(startTime.split(':')[0], 10);
    const startM = parseInt(startTime.split(':')[1], 10);
    const endH = parseInt(endTime.split(':')[0], 10);
    const endM = parseInt(endTime.split(':')[1], 10);

    const durationHours = Math.max(0.5, (endH * 60 + endM - (startH * 60 + startM)) / 60);

    const result = addBooking({
      roomId,
      customerId,
      title,
      date,
      startTime,
      endTime,
      durationHours,
    });

    return NextResponse.json({ success: true, data: result.booking, overageAdded: result.overageAdded });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Booking ID required' }, { status: 400 });

    const deleted = deleteBooking(id);
    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
