import { NextRequest, NextResponse } from 'next/server';
import { getBookingAvailability, getBranchDayAvailability, getMeetingRooms, readableError } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const roomId = searchParams.get('roomId');
    const date = searchParams.get('date');
    if (!branchId || !date) {
      return NextResponse.json({ success: false, error: 'Cabang dan tanggal wajib dipilih.' }, { status: 400 });
    }
    const rooms = await getMeetingRooms(branchId);
    const room = rooms.find((item) => !roomId || item.id === roomId) || rooms[0];
    if (!room) return NextResponse.json({ success: false, error: 'Meeting room tidak ditemukan di cabang ini.' }, { status: 404 });
    const [bookings,schedule] = await Promise.all([getBookingAvailability(room.id, date),getBranchDayAvailability(branchId,date)]);
    return NextResponse.json({ success: true, data: { room: { id: room.id, name: room.name }, bookings, schedule } });
  } catch (error) {
    return NextResponse.json({ success: false, error: readableError(error) }, { status: 500 });
  }
}
