import { NextRequest, NextResponse } from 'next/server';
import { getBranches, getStaffUsers, readableError, updateStaffUser } from '@/lib/data-store';
import { getCurrentStaffRole } from '@/lib/server-auth';

export const dynamic='force-dynamic';

export async function GET(){
  try{
    const staff=await getCurrentStaffRole();
    if(!staff||staff.role!=='super_admin')return NextResponse.json({success:false,error:'Hanya super admin yang dapat mengelola user.'},{status:403});
    const [users,branches]=await Promise.all([getStaffUsers(),getBranches()]);
    return NextResponse.json({success:true,data:{users,branches}});
  }catch(error){return NextResponse.json({success:false,error:readableError(error)},{status:500});}
}

export async function PUT(req:NextRequest){
  try{
    const staff=await getCurrentStaffRole();
    if(!staff||staff.role!=='super_admin')return NextResponse.json({success:false,error:'Hanya super admin yang dapat mengelola user.'},{status:403});
    const body=await req.json();
    if(!body.userId)return NextResponse.json({success:false,error:'User wajib dipilih.'},{status:400});
    if(body.userId===staff.user.id)return NextResponse.json({success:false,error:'Role dan status akun yang sedang digunakan tidak dapat diubah dari halaman ini.'},{status:400});
    const allowedRoles=['super_admin','branch_admin','finance','sales'];
    if(body.role&&!allowedRoles.includes(body.role))return NextResponse.json({success:false,error:'Role tidak valid.'},{status:400});
    if(body.role==='branch_admin'&&!body.branchId)return NextResponse.json({success:false,error:'User cabang wajib memiliki cabang.'},{status:400});
    const updated=await updateStaffUser(body.userId,{role:body.role,branchId:body.role==='branch_admin'?body.branchId:null,isActive:Boolean(body.isActive)});
    return NextResponse.json({success:true,data:updated});
  }catch(error){return NextResponse.json({success:false,error:readableError(error)},{status:500});}
}
