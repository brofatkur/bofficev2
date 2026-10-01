import { NextRequest, NextResponse } from 'next/server';
import { readableError, searchActiveTenants } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const query = new URL(request.url).searchParams.get('q')?.trim() || '';
    const words = query.split(/\s+/).filter(Boolean);
    if (words.length < 2) return NextResponse.json({ success: true, data: [] });
    return NextResponse.json({ success: true, data: await searchActiveTenants(query) });
  } catch (error) {
    return NextResponse.json({ success: false, error: readableError(error) }, { status: 500 });
  }
}
