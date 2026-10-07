import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { getBranches } from '@/lib/data-store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code')?.toUpperCase();
  const origin = req.nextUrl.origin;

  if (!code) {
    return NextResponse.json({ success: false, error: 'Kode cabang required' }, { status: 400 });
  }

  const branches = await getBranches();
  const branch = branches.find((b) => b.code.toUpperCase() === code);

  if (!branch) {
    return NextResponse.json({ success: false, error: 'Cabang tidak ditemukan' }, { status: 404 });
  }

  const bookingUrl = `${origin}/book?branch=${encodeURIComponent(branch.id)}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(bookingUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        branch,
        bookingUrl,
        qrDataUrl,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
