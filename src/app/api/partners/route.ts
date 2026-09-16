import { NextRequest, NextResponse } from 'next/server';
import { addPartner, getPartners, readableError, updatePartner } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const type = new URL(req.url).searchParams.get('type') || undefined;
    return NextResponse.json({ success: true, data: await getPartners(type) });
  } catch (error) {
    return NextResponse.json({ success: false, error: readableError(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.code || !body.name || !body.partnerType) return NextResponse.json({ success: false, error: 'Kode, nama, dan jenis mitra wajib diisi.' }, { status: 400 });
    return NextResponse.json({ success: true, data: await addPartner(body) });
  } catch (error) {
    return NextResponse.json({ success: false, error: readableError(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: 'ID wajib diisi.' }, { status: 400 });
    return NextResponse.json({ success: true, data: await updatePartner(id, updates) });
  } catch (error) {
    return NextResponse.json({ success: false, error: readableError(error) }, { status: 500 });
  }
}
