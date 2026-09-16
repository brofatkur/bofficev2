import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@insforge/sdk/ssr';

export const dynamic='force-dynamic';
export async function GET(){
  const client=createServerClient({cookies:cookies()});
  const {data:userData,error:userError}=await client.auth.getCurrentUser();
  if(userError||!userData?.user)return NextResponse.json({success:false,error:'Sesi tidak aktif.'},{status:401});
  const {data:roleRows,error:roleError}=await client.database.from('user_roles').select().eq('user_id',userData.user.id).limit(1);
  if(roleError||!roleRows?.length)return NextResponse.json({success:false,error:'Role akun belum dikonfigurasi.'},{status:403});
  const role:any=roleRows[0];let payload:any={role,user:{id:userData.user.id,email:userData.user.email}};
  if(role.role==='customer'){
    const [customer,invoices,documents]=await Promise.all([client.database.from('customers').select().eq('id',role.customer_id).maybeSingle(),client.database.from('invoices').select().eq('customer_id',role.customer_id).order('created_at',{ascending:false}).limit(100),client.database.from('customer_documents').select().eq('customer_id',role.customer_id).order('created_at',{ascending:false}).limit(100)]);
    payload={...payload,customer:customer.data,invoices:invoices.data||[],documents:documents.data||[]};
  }else if(role.role==='reseller'){
    const [partner,invoices,commissions,customers]=await Promise.all([client.database.from('partners').select().eq('id',role.partner_id).maybeSingle(),client.database.from('invoices').select().eq('reseller_id',role.partner_id).order('created_at',{ascending:false}).limit(100),client.database.from('reseller_commissions').select().eq('reseller_id',role.partner_id).order('created_at',{ascending:false}).limit(100),client.database.from('customers').select().limit(500)]);
    payload={...payload,partner:partner.data,invoices:invoices.data||[],commissions:commissions.data||[],customers:customers.data||[]};
  }else if(role.role==='property_partner'){
    const [partner,branches,transactions,shares]=await Promise.all([client.database.from('partners').select().eq('id',role.partner_id).maybeSingle(),client.database.from('branches').select().eq('property_partner_id',role.partner_id).limit(100),client.database.from('financial_transactions').select().eq('status','approved').order('transaction_date',{ascending:false}).limit(500),client.database.from('branch_profit_share_periods').select().order('period_start',{ascending:false}).limit(100)]);
    payload={...payload,partner:partner.data,branches:branches.data||[],transactions:transactions.data||[],shares:shares.data||[]};
  }
  return NextResponse.json({success:true,data:payload});
}
