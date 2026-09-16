import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@insforge/sdk/ssr';
import { getCustomerDocuments, readableError, reviewCustomerDocument, uploadCustomerDocument } from '@/lib/data-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function documentAccess(customerId:string){
  const client=createServerClient({cookies:cookies()});
  const {data:userData}=await client.auth.getCurrentUser();
  if(!userData?.user)return {allowed:false,staff:false};
  const {data:roles}=await client.database.from('user_roles').select().eq('user_id',userData.user.id).eq('is_active',true).limit(1);
  const role:any=roles?.[0];
  const staff=['super_admin','branch_admin','finance','sales'].includes(role?.role);
  return {allowed:staff||(role?.role==='customer'&&role.customer_id===customerId),staff};
}

export async function GET(req: NextRequest) {
  try {
    const customerId = new URL(req.url).searchParams.get('customerId');
    if (!customerId) return NextResponse.json({ success: false, error: 'Customer wajib dipilih.' }, { status: 400 });
    if (!(await documentAccess(customerId)).allowed) return NextResponse.json({ success: false, error: 'Akses dokumen tidak diizinkan.' }, { status: 403 });
    return NextResponse.json({ success: true, data: await getCustomerDocuments(customerId) });
  } catch (error) {
    return NextResponse.json({ success: false, error: readableError(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const customerId = String(form.get('customerId') || '');
    const documentType = String(form.get('documentType') || 'other');
    const file = form.get('file');
    if (!customerId || !(file instanceof File)) return NextResponse.json({ success: false, error: 'Customer dan file wajib diisi.' }, { status: 400 });
    if (!(await documentAccess(customerId)).allowed) return NextResponse.json({ success: false, error: 'Akses dokumen tidak diizinkan.' }, { status: 403 });
    const allowed = ['application/pdf','image/jpeg','image/png','image/webp'];
    if (!allowed.includes(file.type)) return NextResponse.json({ success: false, error: 'File harus PDF, JPG, PNG, atau WebP.' }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ success: false, error: 'Ukuran file maksimal 10 MB.' }, { status: 400 });
    return NextResponse.json({ success: true, data: await uploadCustomerDocument(customerId, documentType, file) });
  } catch (error) {
    return NextResponse.json({ success: false, error: readableError(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, status, rejectionReason, customerId } = await req.json();
    const access=await documentAccess(customerId || '');
    if(!access.staff)return NextResponse.json({success:false,error:'Hanya admin yang dapat memverifikasi dokumen.'},{status:403});
    return NextResponse.json({ success: true, data: await reviewCustomerDocument(id, status, rejectionReason) });
  } catch (error) {
    return NextResponse.json({ success: false, error: readableError(error) }, { status: 500 });
  }
}
