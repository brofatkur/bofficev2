import { NextRequest, NextResponse } from 'next/server';
import { checkInAttendee, getMeetingRooms } from '@/lib/data-store';

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

    // Resolve room in branch if not provided
    if (!roomId) {
      const rooms = getMeetingRooms(branchId);
      roomId = rooms.length > 0 ? rooms[0].id : 'mr_' + branchId;
    }

    const result = checkInAttendee({
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
