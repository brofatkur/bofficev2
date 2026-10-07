import { cookies } from 'next/headers';
import { createServerClient } from '@insforge/sdk/ssr';

export async function getCurrentStaffRole() {
  const client=createServerClient({cookies:await cookies()});
  const {data:userData}=await client.auth.getCurrentUser();
  if(!userData?.user)return null;
  const {data:rows}=await client.database.from('user_roles').select().eq('user_id',userData.user.id).eq('is_active',true).limit(1);
  const role:any=rows?.[0];
  if(!role||!['super_admin','branch_admin','finance','sales'].includes(role.role))return null;
  return {user:userData.user,role:role.role as string,branchId:role.branch_id as string|undefined};
}
