import { NextResponse } from 'next/server';
import { getBranches, getMeetingRooms } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [rooms, branches] = await Promise.all([getMeetingRooms(), getBranches()]);
  const activeBranchIds = new Set(branches.filter((branch) => branch.status === 'active').map((branch) => branch.id));
  return NextResponse.json({
    success: true,
    data: rooms.filter((room) => activeBranchIds.has(room.branchId)).map(({ id, branchId, name, capacity }) => ({ id, branchId, name, capacity })),
  });
}
