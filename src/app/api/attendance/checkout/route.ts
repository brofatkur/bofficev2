import { NextRequest, NextResponse } from 'next/server';
import { checkOutAttendee, getMeetingRooms } from '@/lib/data-store';
import { sendWhatsAppMessage } from '@/lib/kirimdev';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { logId } = body;

    if (!logId) {
      return NextResponse.json({ success: false, error: 'Log ID required' }, { status: 400 });
    }

    const updatedLog = await checkOutAttendee(logId);
    if (!updatedLog) {
      return NextResponse.json({ success: false, error: 'Sesi check-in tidak ditemukan' }, { status: 404 });
    }

    // Optionally send KirimDev WhatsApp Check-Out Notification Summary!
    const rooms = await getMeetingRooms();
    const room = rooms.find((r) => r.id === updatedLog.roomId);
    const roomName = room ? room.name : 'Meeting Room';

    const message =
      `Halo *${updatedLog.name}* (${updatedLog.organization}),\n\n` +
      `Terima kasih telah menggunakan *${roomName}* di Nusantara Office Center.\n` +
      `Sesi rapat Anda telah selesai (Check-Out):\n` +
      `• Waktu Masuk: ${new Date(updatedLog.checkInTime).toLocaleTimeString('id-ID')}\n` +
      `• Waktu Keluar: ${new Date(updatedLog.checkOutTime!).toLocaleTimeString('id-ID')}\n` +
      `• Durasi Pemakaian: *${updatedLog.durationMinutes} Menit (${updatedLog.durationHours} Jam)*\n\n` +
      `Sampai jumpa kembali! 🙏`;

    sendWhatsAppMessage({
      to: updatedLog.phone,
      message,
      messageType: 'attendance',
    }).catch(console.error);

    return NextResponse.json({ success: true, data: updatedLog });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
