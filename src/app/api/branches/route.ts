import { NextRequest, NextResponse } from 'next/server';
import { getBranches, addBranch, updateBranch } from '@/lib/data-store';

export async function GET() {
  const branches = await getBranches();
  return NextResponse.json({ success: true, data: branches });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.code || !body.name || !body.city || !body.address) {
      return NextResponse.json(
        { success: false, error: 'Kode cabang, nama, kota, dan alamat wajib diisi' },
        { status: 400 }
      );
    }
    const newBranch = await addBranch(body);
    return NextResponse.json({ success: true, data: newBranch });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ success: false, error: 'Branch ID required' }, { status: 400 });

    const updated = await updateBranch(id, updates);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
