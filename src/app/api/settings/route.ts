import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSettings, getWhatsAppLogs } from '@/lib/data-store';

export async function GET() {
  const settings = getSettings();
  const logs = getWhatsAppLogs();
  return NextResponse.json({ success: true, data: { settings, logs } });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = updateSettings(body);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
