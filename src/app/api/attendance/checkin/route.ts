import { NextRequest, NextResponse } from 'next/server';
import { checkInAttendee } from '@/lib/data-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, name, organization, roomId, customerId, title } = body;

    if (!phone || !name || !organization || !roomId) {
      return NextResponse.json(
        { success: false, error: 'No. HP, Nama, Asal Lembaga, dan Ruangan wajib diisi' },
        { status: 400 }
      );
    }

    const result = checkInAttendee({
      phone,
      name,
      organization,
      roomId,
      customerId,
      title,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
