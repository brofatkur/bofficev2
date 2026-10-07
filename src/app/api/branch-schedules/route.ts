import { NextRequest, NextResponse } from 'next/server';
import { getBranches, getBranchWorkingHours, readableError, saveBranchWorkingHours } from '@/lib/data-store';
import { getCurrentStaffRole } from '@/lib/server-auth';

export const dynamic='force-dynamic';

export async function GET(req:NextRequest){
  try{
    const branchId=new URL(req.url).searchParams.get('branchId');
    if(!branchId)return NextResponse.json({success:false,error:'Cabang wajib dipilih.'},{status:400});
    const staff=await getCurrentStaffRole();
    if(!staff)return NextResponse.json({success:false,error:'Sesi tidak aktif.'},{status:401});
    if(staff.role==='branch_admin'&&staff.branchId!==branchId)return NextResponse.json({success:false,error:'Cabang ini bukan cakupan akun Anda.'},{status:403});
    const branch=(await getBranches()).find(item=>item.id===branchId);
    if(!branch)return NextResponse.json({success:false,error:'Cabang tidak ditemukan.'},{status:404});
    return NextResponse.json({success:true,data:{branch,hours:await getBranchWorkingHours(branchId)}});
  }catch(error){return NextResponse.json({success:false,error:readableError(error)},{status:500});}
}

export async function PUT(req:NextRequest){
  try{
    const staff=await getCurrentStaffRole();
    if(!staff||!['super_admin','branch_admin'].includes(staff.role))return NextResponse.json({success:false,error:'Akses tidak diizinkan.'},{status:403});
    const body=await req.json();
    if(!body.branchId||!Array.isArray(body.hours)||body.hours.length!==7)return NextResponse.json({success:false,error:'Cabang dan 7 hari jadwal wajib diisi.'},{status:400});
    if(staff.role==='branch_admin'&&staff.branchId!==body.branchId)return NextResponse.json({success:false,error:'Cabang ini bukan cakupan akun Anda.'},{status:403});
    for(const item of body.hours){
      if(!Number.isInteger(item.dayOfWeek)||item.dayOfWeek<0||item.dayOfWeek>6)return NextResponse.json({success:false,error:'Hari kerja tidak valid.'},{status:400});
      if(item.isOpen&&(!/^\d{2}:\d{2}$/.test(item.openTime)||!/^\d{2}:\d{2}$/.test(item.closeTime)||item.openTime>=item.closeTime))return NextResponse.json({success:false,error:'Jam buka harus lebih awal dari jam tutup.'},{status:400});
    }
    const hours=await saveBranchWorkingHours(body.branchId,body.hours,Boolean(body.openOnNationalHolidays));
    return NextResponse.json({success:true,data:hours});
  }catch(error){return NextResponse.json({success:false,error:readableError(error)},{status:500});}
}
