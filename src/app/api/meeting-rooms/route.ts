import { NextResponse } from 'next/server';
import { getMeetingRooms } from '@/lib/data-store';

export async function GET() {
  const rooms = await getMeetingRooms();
  return NextResponse.json({ success: true, data: rooms });
}
