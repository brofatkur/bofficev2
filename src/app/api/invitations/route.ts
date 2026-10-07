import { createHash, randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createInvitation, readableError, sendAppEmail, updateCustomer } from '@/lib/data-store';
import { sendWhatsAppMessage } from '@/lib/kirimdev';
import { getCurrentStaffRole } from '@/lib/server-auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest){
  try{
    const body=await req.json();
    const staff=await getCurrentStaffRole();
    if(!staff)return NextResponse.json({success:false,error:'Sesi tidak aktif.'},{status:401});
    if(['super_admin','branch_admin','finance','sales'].includes(body.role)&&staff.role!=='super_admin')return NextResponse.json({success:false,error:'Hanya super admin yang dapat menambah user internal.'},{status:403});
    if(!body.email||!body.fullName||!body.role)return NextResponse.json({success:false,error:'Email, nama, dan role wajib diisi.'},{status:400});
    if(body.role==='branch_admin'&&!body.branchId)return NextResponse.json({success:false,error:'Cabang wajib dipilih untuk user cabang.'},{status:400});
    const token=randomBytes(32).toString('hex');const tokenHash=createHash('sha256').update(token).digest('hex');
    const expiresAt=new Date(Date.now()+24*60*60*1000).toISOString();
    const invitation=await createInvitation({email:String(body.email).toLowerCase(),phone:body.phone,fullName:body.fullName,role:body.role,branchId:body.branchId,customerId:body.customerId,partnerId:body.partnerId,tokenHash,expiresAt});
    if(body.customerId)await updateCustomer(body.customerId,{onboardingStatus:'invited'});
    const origin=process.env.NEXT_PUBLIC_APP_URL||new URL(req.url).origin;const inviteUrl=`${origin}/invite/${token}`;
    const message=`Undangan Portal BOffice\n\nHalo ${body.fullName}, buat password dan aktifkan akun Anda melalui tautan berikut (berlaku 24 jam):\n${inviteUrl}\n\nJangan bagikan tautan ini.`;
    let delivery='link';
    if(body.channel==='email'){await sendAppEmail(body.email,'Aktifkan akun Portal BOffice',`<p>Halo ${body.fullName},</p><p>Aktifkan akun Portal BOffice melalui tautan berikut (berlaku 24 jam):</p><p><a href="${inviteUrl}">${inviteUrl}</a></p><p>Jangan bagikan tautan ini.</p>`);delivery='email';}
    if(body.channel==='whatsapp'&&body.phone){await sendWhatsAppMessage({to:body.phone,message,messageType:'custom'});delivery='whatsapp';}
    return NextResponse.json({success:true,data:{id:invitation.id,inviteUrl,delivery,expiresAt}});
  }catch(error){return NextResponse.json({success:false,error:readableError(error)},{status:500})}
}
