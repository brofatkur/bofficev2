import { NextRequest, NextResponse } from 'next/server';
import { checkInAttendee, getBookingsForCheckin, getMeetingRooms } from '@/lib/data-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { phone, name, organization, branchId, roomId, bookingId, title } = body;

    if (!phone || !name || !organization || !branchId) {
      return NextResponse.json(
        { success: false, error: 'No. HP, Nama, Asal Lembaga, dan Cabang wajib diisi' },
        { status: 400 }
      );
    }

    if (bookingId) {
      const matchingBookings = await getBookingsForCheckin(branchId, phone);
      const booking = matchingBookings.find((item) => item.id === bookingId);
      if (!booking) {
        return NextResponse.json(
          { success: false, error: 'Booking tidak ditemukan untuk nomor HP dan cabang ini.' },
          { status: 404 }
        );
      }

      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' });
      if (String(booking.date).slice(0, 10) !== today) {
        return NextResponse.json(
          { success: false, error: `Check-in hanya dapat dilakukan pada tanggal booking, ${String(booking.date).slice(0, 10)}.` },
          { status: 409 }
        );
      }

      roomId = booking.roomId;
      title = booking.title;
    }

    // Resolve room in branch if not provided
    if (!roomId) {
      const rooms = await getMeetingRooms(branchId);
      roomId = rooms.length > 0 ? rooms[0].id : 'mr_' + branchId;
    }

    const result = await checkInAttendee({
      phone,
      name,
      organization,
      branchId,
      roomId,
      bookingId,
      title,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
