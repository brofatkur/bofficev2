import { NextResponse } from 'next/server';
import { getOffices } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const offices = await getOffices();
  return NextResponse.json({ success: true, data: offices });
}
