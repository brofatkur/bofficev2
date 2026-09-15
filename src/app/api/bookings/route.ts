import { NextRequest, NextResponse } from 'next/server';
import { getBookings, addBooking, cancelBooking, getBranches, getMeetingRooms } from '@/lib/data-store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get('branchId') || undefined;
  const bookings = getBookings(branchId);
  return NextResponse.json({ success: true, data: bookings });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { branchId, roomId, customerId, title, date, startTime, endTime, createdBy } = body;

    if (!branchId || !customerId || !title || !date || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: 'Cabang, Penyewa, Judul Rapat, Tanggal, dan Jam Mulai/Selesai wajib diisi' },
        { status: 400 }
      );
    }

    // Auto-resolve roomId if not selected (1 branch has 1 room in MVP per PRD 5.3)
    if (!roomId) {
      const rooms = getMeetingRooms(branchId);
      if (rooms.length > 0) {
        roomId = rooms[0].id;
      } else {
        roomId = 'mr_' + branchId;
      }
    }

    // Calculate duration
    const startH = parseInt(startTime.split(':')[0], 10);
    const startM = parseInt(startTime.split(':')[1], 10);
    const endH = parseInt(endTime.split(':')[0], 10);
    const endM = parseInt(endTime.split(':')[1], 10);
    const durationHours = Math.max(0.5, parseFloat(((endH * 60 + endM - (startH * 60 + startM)) / 60).toFixed(2)));

    const result = addBooking({
      branchId,
      roomId,
      customerId,
      title,
      date,
      startTime,
      endTime,
      durationHours,
      createdBy: createdBy || 'admin',
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 409 });
    }

    return NextResponse.json({ success: true, data: result.booking });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Booking ID required' }, { status: 400 });

    const cancelled = cancelBooking(id);
    return NextResponse.json({ success: cancelled });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
