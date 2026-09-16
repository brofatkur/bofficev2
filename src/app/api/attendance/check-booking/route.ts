import { NextRequest, NextResponse } from 'next/server';
import { getBookingsForCheckin, getBranches, getMeetingRooms, getCustomers } from '@/lib/data-store';

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

  const result = getBookingsForCheckin(branchId, phone);
  const rooms = getMeetingRooms(branchId);
  const roomName = rooms.length > 0 ? rooms[0].name : 'Meeting Room Cabang';

  let tenantName = '';
  if (result.booking) {
    const customers = getCustomers();
    const c = customers.find((cust) => cust.id === result.booking?.customerId);
    tenantName = c ? c.companyName : '';
  } else if (result.customer) {
    tenantName = result.customer.companyName;
  }

  return NextResponse.json({
    success: true,
    data: {
      found: result.found,
      booking: result.booking,
      roomName,
      tenantName,
      allBookings: result.allBookings,
    },
  });
}
