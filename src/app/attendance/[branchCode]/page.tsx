import { redirect } from 'next/navigation';

export default function LegacyAttendancePage({ params }: { params: { branchCode: string } }) {
  redirect(`/book?branch=${encodeURIComponent(params.branchCode)}`);
}
