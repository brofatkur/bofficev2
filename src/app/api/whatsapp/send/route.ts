import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/kirimdev';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, message, messageType } = body;

    if (!to || !message) {
      return NextResponse.json({ success: false, error: 'Nomor WhatsApp dan Pesan wajib diisi' }, { status: 400 });
    }

    const result = await sendWhatsAppMessage({ to, message, messageType: messageType || 'custom' });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
