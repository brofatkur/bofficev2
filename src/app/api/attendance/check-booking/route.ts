import { NextRequest, NextResponse } from 'next/server';
import { getBookingsForCheckin, getMeetingRooms, getCustomers } from '@/lib/data-store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get('branchId');
  const phone = searchParams.get('phone');

  if (!branchId || !phone) {
    return NextResponse.json(
      { success: false, error: 'branchId dan phone wajib diisi' },
      { status: 400 }
    );
  }

  const allBookings = await getBookingsForCheckin(branchId, phone);
  const rooms = await getMeetingRooms(branchId);
  const roomName = rooms.length > 0 ? rooms[0].name : 'Meeting Room Cabang';
  const booking = allBookings.length > 0 ? allBookings[0] : null;

  let tenantName = '';
  if (booking) {
    const customers = await getCustomers(branchId);
    const c = customers.find((cust) => cust.id === booking.customerId);
    tenantName = c ? c.companyName : (booking as any).bookerName || '';
  }

  return NextResponse.json({
    success: true,
    data: {
      found: allBookings.length > 0,
      booking,
      roomName,
      tenantName,
      allBookings,
    },
  });
}
