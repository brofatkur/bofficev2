import { NextRequest, NextResponse } from 'next/server';
import { getBookings, addBooking, cancelBooking, getMeetingRooms, getBranches, getCustomers, getSettings, getBranchDayAvailability } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get('branchId') || undefined;
  const bookings = await getBookings(branchId);
  return NextResponse.json({ success: true, data: bookings }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { branchId, roomId, customerId, bookingType, bookerName, bookerPhone, title, date, startTime, endTime, createdBy } = body;

    if (!branchId || !title || !date || !startTime || !endTime || (bookingType !== 'general' && !customerId)) {
      return NextResponse.json(
        { success: false, error: 'Cabang, Penyewa, Judul Rapat, Tanggal, dan Jam Mulai/Selesai wajib diisi' },
        { status: 400 }
      );
    }

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < today) return NextResponse.json({ success: false, error: 'Tanggal booking tidak valid atau sudah lewat.' }, { status: 400 });
    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime) || startTime >= endTime) return NextResponse.json({ success: false, error: 'Jam mulai dan selesai tidak valid.' }, { status: 400 });
    if (bookingType === 'general' && (!bookerName?.trim() || !bookerPhone?.trim())) {
      return NextResponse.json({ success: false, error: 'Nama dan nomor HP customer umum wajib diisi.' }, { status: 400 });
    }

    const branch = (await getBranches()).find((item) => item.id === branchId && item.status === 'active');
    if (!branch) return NextResponse.json({ success: false, error: 'Cabang tidak ditemukan atau sedang tidak aktif.' }, { status: 404 });

    const rooms = await getMeetingRooms(branchId);
    const selectedRoom = roomId ? rooms.find((room) => room.id === roomId) : rooms[0];
    if (!selectedRoom) return NextResponse.json({ success: false, error: 'Meeting room aktif pada cabang ini tidak ditemukan.' }, { status: 404 });
    roomId = selectedRoom.id;

    // Calculate duration
    const startH = parseInt(startTime.split(':')[0], 10);
    const startM = parseInt(startTime.split(':')[1], 10);
    const endH = parseInt(endTime.split(':')[0], 10);
    const endM = parseInt(endTime.split(':')[1], 10);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const durationMinutes = endMinutes - startMinutes;
    if (startM % 30 !== 0 || endM % 30 !== 0 || durationMinutes < 30 || durationMinutes > 240) return NextResponse.json({ success: false, error: 'Durasi booking harus 30 menit sampai 4 jam dalam interval 30 menit.' }, { status: 400 });
    const schedule=await getBranchDayAvailability(branchId,date);
    if(!schedule.isOpen){
      const message=schedule.reason==='national_holiday'?`Cabang tutup pada libur nasional${schedule.holidayName?`: ${schedule.holidayName}`:''}.`:'Cabang tutup pada hari yang dipilih.';
      return NextResponse.json({success:false,error:message},{status:400});
    }
    const scheduleOpen=String(schedule.openTime||'00:00').slice(0,5),scheduleClose=String(schedule.closeTime||'00:00').slice(0,5);
    if(startTime<scheduleOpen||endTime>scheduleClose)return NextResponse.json({success:false,error:`Booking hanya tersedia pukul ${scheduleOpen}–${scheduleClose} WITA pada hari tersebut.`},{status:400});
    const durationHours = Number((durationMinutes / 60).toFixed(2));

    let isOverage = false;
    let overageFee = 0;
    if (customerId && bookingType !== 'general') {
      const [settings,customers] = await Promise.all([getSettings(),getCustomers()]);
      const period = date.slice(0, 7);
      const usedHours = (await getBookings())
        .filter((booking) => booking.customerId === customerId && booking.status !== 'cancelled' && String(booking.date).slice(0, 7) === period)
        .reduce((total, booking) => total + Number(booking.durationHours || 0), 0);
      const customer=customers.find(item=>item.id===customerId);
      const quota = Number(customer?.meetingRoomMonthlyFreeHours ?? settings.meetingRoomMonthlyFreeHours ?? 8);
      const rate = Number(settings.meetingRoomOverageRatePerHour || 90000);
      const previousOverage = Math.max(0, usedHours - quota);
      const newOverage = Math.max(0, usedHours + durationHours - quota);
      const chargeableHours = Math.max(0, newOverage - previousOverage);
      isOverage = chargeableHours > 0;
      overageFee = Math.round(chargeableHours * rate);
    }

    const result = await addBooking({
      branchId,
      roomId,
      customerId: bookingType === 'general' ? undefined : customerId,
      bookerName: bookerName?.trim(),
      bookerPhone: bookerPhone?.trim(),
      title,
      date,
      startTime,
      endTime,
      durationHours,
      createdBy: createdBy || 'admin',
      isOverage,
      overageFee,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 409 });
    }

    return NextResponse.json({ success: true, data: result.booking, overageAdded: isOverage });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Booking ID required' }, { status: 400 });

    const cancelled = await cancelBooking(id);
    return NextResponse.json({ success: cancelled });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
