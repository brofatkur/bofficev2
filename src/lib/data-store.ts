import 'server-only';
import { createAdminClient } from '@insforge/sdk';
import { AppSettings, Branch, Contract, Customer, FinancialTransaction, Invoice, InvoiceItem, InvoicePayment, Lead, MeetingAttendanceLog, MeetingAttendee, MeetingBooking, MeetingRoom, OfficeSpace, Partner, Product, ProductCategory, ProductVendorPrice, TotalTaxItem, WhatsAppLog } from './types';

let adminClient: ReturnType<typeof createAdminClient> | null = null;
function getInsforge() {
  if (adminClient) return adminClient;
  const baseUrl = process.env.INSFORGE_URL || process.env.NEXT_PUBLIC_INSFORGE_URL;
  const apiKey = process.env.INSFORGE_API_KEY;
  if (!baseUrl || !apiKey) throw new Error('INSFORGE_URL dan INSFORGE_API_KEY wajib dikonfigurasi pada environment server.');
  adminClient = createAdminClient({ baseUrl, apiKey });
  return adminClient;
}
const MAX_ROWS = 1000;

const keys: Record<string, string> = {
  company_name:'companyName',entity_type:'entityType',service_type:'serviceType',branch_id:'branchId',pic_name:'picName',start_date:'startDate',lead_id:'leadId',interest_type:'interestType',billing_cycle:'billingCycle',estimated_value:'estimatedValue',updated_at:'updatedAt',created_at:'createdAt',public_attendance_url:'publicAttendanceUrl',monthly_price:'monthlyPrice',yearly_price:'yearlyPrice',current_tenant_id:'currentTenantId',hourly_overage_rate:'hourlyOverageRate',room_id:'roomId',customer_id:'customerId',start_time:'startTime',end_time:'endTime',duration_hours:'durationHours',created_by:'createdBy',is_overage:'isOverage',overage_fee:'overageFee',attendee_id:'attendeeId',booking_id:'bookingId',check_in_time:'checkInTime',check_out_time:'checkOutTime',duration_minutes:'durationMinutes',contract_number:'contractNumber',office_id:'officeId',rental_type:'rentalType',end_date:'endDate',rent_price:'rentPrice',auto_renew:'autoRenew',last_wa_reminder_sent_at:'lastWaReminderSentAt',invoice_number:'invoiceNumber',contract_id:'contractId',issue_date:'issueDate',due_date:'dueDate',total_discount_type:'totalDiscountType',total_discount_value:'totalDiscountValue',total_discount_amount:'totalDiscountAmount',total_tax_amount:'totalTaxAmount',total_amount:'totalAmount',total_paid:'totalPaid',remaining_amount:'remainingAmount',auto_notification:'autoNotification',last_wa_sent_at:'lastWaSentAt',invoice_id:'invoiceId',item_type:'itemType',discount_type:'discountType',discount_value:'discountValue',discount_amount:'discountAmount',tax_name:'taxName',tax_percent:'taxPercent',tax_amount:'taxAmount',receipt_number:'receiptNumber',payment_date:'paymentDate',payment_method:'paymentMethod',recorded_by:'recordedBy',message_type:'messageType',sent_at:'sentAt',kirimdev_api_key:'kirimdevApiKey',kirimdev_phone_number_id:'kirimdevPhoneNumberId',company_address:'companyAddress',company_phone:'companyPhone',bank_account_info:'bankAccountInfo',meeting_room_monthly_free_hours:'meetingRoomMonthlyFreeHours',meeting_room_overage_rate_per_hour:'meetingRoomOverageRatePerHour',auto_notification_enabled:'autoNotificationEnabled',reminder_intervals:'reminderIntervals',ownership_type:'ownershipType',property_partner_id:'propertyPartnerId',property_share_percent:'propertySharePercent',user_id:'userId',onboarding_status:'onboardingStatus',profile_completed_at:'profileCompletedAt',partner_type:'partnerType',contact_name:'contactName',tax_id:'taxId',commission_default_model:'commissionDefaultModel',commission_default_rate:'commissionDefaultRate',is_active:'isActive',category_id:'categoryId',variant_name:'variantName',sale_price:'salePrice',product_id:'productId',vendor_id:'vendorId',vendor_price_id:'vendorPriceId',component_name:'componentName',service_variant:'serviceVariant',unit_cost:'unitCost',valid_from:'validFrom',valid_until:'validUntil',is_preferred:'isPreferred',estimated_hpp:'estimatedHpp',actual_hpp:'actualHpp',gross_profit:'grossProfit',margin_percent:'marginPercent',reseller_id:'resellerId',commission_model:'commissionModel',commission_rate:'commissionRate',boffice_net_price:'bofficeNetPrice',reseller_commission:'resellerCommission',transaction_date:'transactionDate',source_type:'sourceType',source_id:'sourceId',partner_id:'partnerId',proof_url:'proofUrl',proof_key:'proofKey',approved_by:'approvedBy',approved_at:'approvedAt',booker_name:'bookerName',booker_phone:'bookerPhone'
};
const reverseKeys = Object.fromEntries(Object.entries(keys).map(([a,b]) => [b,a]));
function fromRow<T>(row: Record<string, any>): T { return Object.fromEntries(Object.entries(row).map(([k,v]) => [keys[k] || k,v])) as T; }
function toRow(value: Record<string, any>): Record<string, any> { return Object.fromEntries(Object.entries(value).filter(([,v]) => v !== undefined).map(([k,v]) => [reverseKeys[k] || k,v])); }
export function readableError(error: any, fallback = 'Terjadi kesalahan pada database') {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error.message === 'string') return error.message;
  if (typeof error.details === 'string') return error.details;
  if (typeof error.error === 'string') return error.error;
  try { return JSON.stringify(error); } catch { return fallback; }
}
function assertOk(error: any) { if (error) throw new Error(readableError(error)); }
function makeId(prefix: string) { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`; }
async function list<T>(table: string, branchId?: string): Promise<T[]> {
  let q: any = getInsforge().database.from(table).select().order('created_at',{ascending:false}).limit(MAX_ROWS);
  if (branchId && branchId !== 'all') q = q.eq('branch_id',branchId);
  const {data,error}=await q; assertOk(error); return ((data||[]) as Record<string,any>[]).map(fromRow<T>);
}
async function insertOne<T>(table:string,value:Record<string,any>):Promise<T>{ const {data,error}=await getInsforge().database.from(table).insert([toRow(value)]).select().single(); assertOk(error); return fromRow<T>(data as Record<string,any>); }
async function updateOne<T>(table:string,id:string,value:Record<string,any>):Promise<T|null>{ const {data,error}=await getInsforge().database.from(table).update(toRow(value)).eq('id',id).select().maybeSingle(); assertOk(error); return data?fromRow<T>(data as Record<string,any>):null; }

export function normalizePhone(phone:string){ let s=phone.replace(/[^0-9]/g,''); if(s.startsWith('62'))s=`0${s.slice(2)}`; return s; }
export async function getBranches(){ return list<Branch>('branches'); }
export async function getBranchByCode(code:string){ const {data,error}=await getInsforge().database.from('branches').select().eq('code',code.trim().toUpperCase()).maybeSingle(); assertOk(error); return data?fromRow<Branch>(data as any):null; }
export async function addBranch(branch:Omit<Branch,'id'|'createdAt'>){
  const code=branch.code.toUpperCase().trim();
  const existing=await getBranchByCode(code);
  const created=existing || await insertOne<Branch>('branches',{...branch,phone:normalizePhone(branch.phone||''),status:branch.status||'active',id:makeId('br'),code,publicAttendanceUrl:`/attendance/${code}`});
  const {data:room,error:roomLookupError}=await getInsforge().database.from('meeting_rooms').select('id').eq('branch_id',created.id).maybeSingle();
  assertOk(roomLookupError);
  if(!room){
    try {
      await insertOne<MeetingRoom>('meeting_rooms',{id:`mr_${created.id}`,branchId:created.id,name:`Meeting Room ${created.name}`,capacity:10,facilities:['Smart Display TV','WiFi High Speed','Whiteboard','AC'],hourlyOverageRate:90000});
    } catch(error){
      if(!existing) await getInsforge().database.from('branches').delete().eq('id',created.id);
      throw error;
    }
  }
  return created;
}
export async function updateBranch(id:string,updates:Partial<Branch>){ return updateOne<Branch>('branches',id,updates); }

export async function getCustomers(branchId?:string){ return list<Customer>('customers',branchId); }
export async function addCustomer(value:Omit<Customer,'id'|'createdAt'|'updatedAt'>){ return insertOne<Customer>('customers',{...value,phone:normalizePhone(value.phone),id:makeId('cus')}); }
export async function updateCustomer(id:string,updates:Partial<Customer>){ return updateOne<Customer>('customers',id,{...updates,updatedAt:new Date().toISOString()}); }

export async function getProductCategories(){ return list<ProductCategory>('product_categories'); }
export async function addProductCategory(value:Partial<ProductCategory>){ return insertOne<ProductCategory>('product_categories',{...value,id:value.id||makeId('cat')}); }
export async function getProducts(){ return list<Product>('products'); }
export async function addProduct(value:Partial<Product>){ return insertOne<Product>('products',{...value,id:value.id||makeId('prd')}); }
export async function updateProduct(id:string,value:Partial<Product>){ return updateOne<Product>('products',id,{...value,updatedAt:new Date().toISOString()}); }
export async function getProductVendorPrices(){ return list<ProductVendorPrice>('product_vendor_prices'); }
export async function addProductVendorPrice(value:Partial<ProductVendorPrice>){ return insertOne<ProductVendorPrice>('product_vendor_prices',{...value,id:value.id||makeId('vpr')}); }
export async function updateProductVendorPrice(id:string,value:Partial<ProductVendorPrice>){ return updateOne<ProductVendorPrice>('product_vendor_prices',id,value); }
export async function getPartners(type?:string){ let q:any=getInsforge().database.from('partners').select().order('created_at',{ascending:false}).limit(MAX_ROWS); if(type&&type!=='all')q=q.eq('partner_type',type); const {data,error}=await q; assertOk(error); return ((data||[]) as any[]).map(fromRow<Partner>); }
export async function addPartner(value:Partial<Partner>){ return insertOne<Partner>('partners',{...value,phone:normalizePhone(value.phone||''),id:value.id||makeId('ptr')}); }
export async function updatePartner(id:string,value:Partial<Partner>){ return updateOne<Partner>('partners',id,{...value,updatedAt:new Date().toISOString()}); }
export async function getFinancialTransactions(branchId?:string){ return list<FinancialTransaction>('financial_transactions',branchId); }
export async function addFinancialTransaction(value:Partial<FinancialTransaction>){ return insertOne<FinancialTransaction>('financial_transactions',{...value,id:value.id||makeId('fin')}); }
export async function updateFinancialTransaction(id:string,value:Partial<FinancialTransaction>){ return updateOne<FinancialTransaction>('financial_transactions',id,{...value,updatedAt:new Date().toISOString()}); }
export async function getProfitSharePeriods(){ return list<any>('branch_profit_share_periods'); }
export async function saveProfitSharePeriod(value:Record<string,any>){ const {data:existing,error}=await getInsforge().database.from('branch_profit_share_periods').select('id').eq('branch_id',value.branchId).eq('period_start',value.periodStart).eq('period_end',value.periodEnd).maybeSingle();assertOk(error);return existing?updateOne<any>('branch_profit_share_periods',(existing as any).id,value):insertOne<any>('branch_profit_share_periods',{...value,id:makeId('share')}); }

export async function getCustomerDocuments(customerId:string){ const {data,error}=await getInsforge().database.from('customer_documents').select().eq('customer_id',customerId).order('created_at',{ascending:false}).limit(100); assertOk(error); return ((data||[]) as any[]).map(fromRow<any>); }
export async function uploadCustomerDocument(customerId:string,documentType:string,file:File){
  const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'-');
  const key=`${customerId}/${Date.now()}-${safeName}`;
  const {data:uploaded,error:uploadError}=await getInsforge().storage.from('customer-documents').upload(key,file); assertOk(uploadError);
  return insertOne<any>('customer_documents',{id:makeId('doc'),customerId,documentType,fileName:file.name,fileUrl:uploaded!.url,fileKey:uploaded!.key,mimeType:file.type||'application/octet-stream',fileSize:file.size,status:'pending'});
}
export async function reviewCustomerDocument(id:string,status:'approved'|'rejected',rejectionReason?:string){ return updateOne<any>('customer_documents',id,{status,rejectionReason,verifiedAt:new Date().toISOString()}); }
export async function createInvitation(value:Record<string,any>){ return insertOne<any>('user_invitations',{...value,id:makeId('invitation')}); }
export async function getInvitationByHash(tokenHash:string){ const {data,error}=await getInsforge().database.from('user_invitations').select().eq('token_hash',tokenHash).maybeSingle();assertOk(error);return data?fromRow<any>(data as any):null; }
export async function acceptInvitation(invitation:any,password:string){
  const {data,error}=await getInsforge().auth.signUp({email:invitation.email,password,name:invitation.fullName});assertOk(error);
  const userId=data?.user?.id;if(!userId)throw new Error('Akun tidak berhasil dibuat.');
  const roleResult=await getInsforge().database.from('user_roles').insert([{user_id:userId,email:invitation.email,full_name:invitation.fullName,role:invitation.role,customer_id:invitation.customerId||null,partner_id:invitation.partnerId||null,is_active:true}]);assertOk(roleResult.error);
  if(invitation.customerId)await updateCustomer(invitation.customerId,{userId,onboardingStatus:'active'});
  if(invitation.partnerId)await updatePartner(invitation.partnerId,{userId});
  await updateOne<any>('user_invitations',invitation.id,{acceptedAt:new Date().toISOString()});
  return {userId,email:invitation.email,role:invitation.role};
}
export async function sendAppEmail(to:string,subject:string,html:string){ const {data,error}=await getInsforge().emails.send({to,subject,html});assertOk(error);return data; }

export async function getMeetingRooms(branchId?:string):Promise<MeetingRoom[]>{ let q:any=getInsforge().database.from('meeting_rooms').select().limit(MAX_ROWS); if(branchId&&branchId!=='all')q=q.eq('branch_id',branchId); const {data,error}=await q; assertOk(error); return ((data||[]) as any[]).map(fromRow<MeetingRoom>); }
export async function getBookings(branchId?:string){ return list<MeetingBooking>('bookings',branchId); }
export async function checkBookingConflict(branchId:string,date:string,startTime:string,endTime:string,excludeId?:string){ let q:any=getInsforge().database.from('bookings').select('id,start_time,end_time').eq('branch_id',branchId).eq('date',date).neq('status','cancelled').limit(MAX_ROWS); if(excludeId)q=q.neq('id',excludeId); const {data,error}=await q; assertOk(error); return ((data||[]) as any[]).some(b=>startTime<String(b.end_time).slice(0,5)&&endTime>String(b.start_time).slice(0,5)); }
export async function addBooking(value:Omit<MeetingBooking,'id'|'createdAt'|'status'>):Promise<{success:boolean;booking?:MeetingBooking;error?:string}>{ if(await checkBookingConflict(value.branchId,value.date,value.startTime,value.endTime))return {success:false,error:'Bentrok Jadwal! Ruang meeting di cabang ini sudah terisi pada tanggal dan jam tersebut.'}; return {success:true,booking:await insertOne<MeetingBooking>('bookings',{...value,id:makeId('book'),status:'confirmed'})}; }
export async function cancelBooking(id:string){ return Boolean(await updateOne('bookings',id,{status:'cancelled'})); }
export async function getBookingsForCheckin(branchId:string,phone:string){
  const norm=normalizePhone(phone),today=new Date().toISOString().slice(0,10);
  const bookings=await getBookings(branchId);
  const customers=await getCustomers(branchId);
  const custMap=new Map(customers.map(c=>[c.id,c]));
  return bookings.filter(b=>{
    if(b.branchId!==branchId||b.status==='cancelled'||b.date!==today)return false;
    if(b.bookerPhone&&normalizePhone(b.bookerPhone)===norm)return true;
    const cust=custMap.get(b.customerId);
    if(cust&&normalizePhone(cust.phone)===norm)return true;
    return false;
  });
}

export async function getAttendeeByPhone(phone:string){ const {data,error}=await getInsforge().database.from('attendees').select().eq('phone',normalizePhone(phone)).maybeSingle(); assertOk(error); return data?fromRow<MeetingAttendee>(data as any):null; }
export async function upsertAttendee(value:{phone:string;name:string;organization:string}){ const phone=normalizePhone(value.phone),current=await getAttendeeByPhone(phone); if(current)return (await updateOne<MeetingAttendee>('attendees',current.id,{...value,phone,updatedAt:new Date().toISOString()}))!; return insertOne<MeetingAttendee>('attendees',{...value,phone,id:makeId('att')}); }
export async function findOngoingBookingAtBranch(branchId:string,dateStr?:string,timeStr?:string){ const now=new Date(),date=dateStr||now.toISOString().slice(0,10),time=timeStr||now.toTimeString().slice(0,5); const {data,error}=await getInsforge().database.from('bookings').select().eq('branch_id',branchId).eq('date',date).eq('status','confirmed').order('start_time').limit(100); assertOk(error); const rows=((data||[]) as any[]).map(fromRow<MeetingBooking>); return rows.find(b=>b.startTime.slice(0,5)<=time&&b.endTime.slice(0,5)>=time)||rows.find(b=>b.startTime.slice(0,5)>time)||rows[0]||null; }
export async function getActiveAttendanceByPhone(phone:string){ const {data,error}=await getInsforge().database.from('attendance_logs').select().eq('phone',normalizePhone(phone)).eq('status','active').maybeSingle(); assertOk(error); return data?fromRow<MeetingAttendanceLog>(data as any):null; }
export async function checkInAttendee(value:{phone:string;name:string;organization:string;branchId:string;roomId:string;bookingId?:string;title?:string}){ const attendee=await upsertAttendee(value),active=await getActiveAttendanceByPhone(value.phone); if(active){const bookings=await getBookings(); return {log:active,attendee,linkedBooking:bookings.find(b=>b.id===active.bookingId)||null};} let linked:MeetingBooking|null=null; if(value.bookingId){const {data,error}=await getInsforge().database.from('bookings').select().eq('id',value.bookingId).maybeSingle(); assertOk(error); linked=data?fromRow<MeetingBooking>(data as any):null;}else linked=await findOngoingBookingAtBranch(value.branchId); const log=await insertOne<MeetingAttendanceLog>('attendance_logs',{id:makeId('log'),attendeeId:attendee.id,phone:normalizePhone(value.phone),name:value.name,organization:value.organization,branchId:value.branchId,roomId:value.roomId,bookingId:value.bookingId||linked?.id,title:value.title||linked?.title||`Sesi Rapat ${value.organization}`,checkInTime:new Date().toISOString(),status:'active'}); return {log,attendee,linkedBooking:linked}; }
export async function checkOutAttendee(id:string){ const {data,error}=await getInsforge().database.from('attendance_logs').select().eq('id',id).maybeSingle(); assertOk(error); if(!data)return null; const log=fromRow<MeetingAttendanceLog>(data as any),now=new Date(),minutes=Math.max(1,Math.round((now.getTime()-new Date(log.checkInTime).getTime())/60000)); return updateOne<MeetingAttendanceLog>('attendance_logs',id,{checkOutTime:now.toISOString(),durationMinutes:minutes,durationHours:Number((minutes/60).toFixed(2)),status:'completed'}); }
export async function getAttendanceLogs(branchId?:string){ return list<MeetingAttendanceLog>('attendance_logs',branchId); }

export async function getContracts(branchId?:string){ return list<Contract>('contracts',branchId); }
export async function addContract(value:Omit<Contract,'id'|'createdAt'>){ return insertOne<Contract>('contracts',{...value,id:makeId('ctr')}); }
export async function updateContract(id:string,updates:Partial<Contract>){ return updateOne<Contract>('contracts',id,updates); }

export function calculateInvoiceTotals(items:Array<{amount:number;quantity:number;discountType?:'nominal'|'percentage';discountValue?:number;taxPercent?:number}>,totalDiscountType?:'nominal'|'percentage',totalDiscountValue?:number,totalTaxes?:Array<{name:string;percent:number}>){
  let subtotal=0;
  const computedItems=items.map(item=>{const gross=item.amount*item.quantity; const discountAmount=item.discountType==='percentage'?gross*(item.discountValue||0)/100:(item.discountValue||0); const net=Math.max(0,gross-discountAmount); const taxAmount=net*(item.taxPercent||0)/100; const total=net+taxAmount; subtotal+=total; return {discountAmount,taxAmount,total};});
  const totalDiscountAmount=totalDiscountType==='percentage'?subtotal*(totalDiscountValue||0)/100:(totalDiscountValue||0); const taxable=Math.max(0,subtotal-totalDiscountAmount);
  const computedTotalTaxes:TotalTaxItem[]=(totalTaxes||[]).map(t=>({...t,amount:taxable*(t.percent||0)/100})); const totalTaxAmount=computedTotalTaxes.reduce((sum,t)=>sum+t.amount,0);
  return {computedItems,subtotal:Math.round(subtotal),totalDiscountAmount:Math.round(totalDiscountAmount),computedTotalTaxes,totalTaxAmount:Math.round(totalTaxAmount),totalAmount:Math.round(taxable+totalTaxAmount)};
}

async function getInvoiceChildren(ids:string[]){
  if(!ids.length)return {items:[] as any[],taxes:[] as any[],payments:[] as any[],costs:[] as any[]};
  const [a,b,c,d]=await Promise.all([
    getInsforge().database.from('invoice_items').select().in('invoice_id',ids).order('position').limit(MAX_ROWS),
    getInsforge().database.from('invoice_total_taxes').select().in('invoice_id',ids).order('position').limit(MAX_ROWS),
    getInsforge().database.from('invoice_payments').select().in('invoice_id',ids).order('created_at').limit(MAX_ROWS),
    getInsforge().database.from('invoice_item_costs').select().in('invoice_id',ids).limit(MAX_ROWS)
  ]); assertOk(a.error);assertOk(b.error);assertOk(c.error);assertOk(d.error); return {items:(a.data||[]) as any[],taxes:(b.data||[]) as any[],payments:(c.data||[]) as any[],costs:(d.data||[]) as any[]};
}
export async function getInvoices(branchId?:string):Promise<Invoice[]>{ const base=await list<any>('invoices',branchId),child=await getInvoiceChildren(base.map((x:any)=>x.id)); return base.map((invoice:any)=>({...invoice,items:child.items.filter(x=>x.invoice_id===invoice.id).map((row:any)=>{const item=fromRow<InvoiceItem>(row);return {...item,costComponents:child.costs.filter((cost:any)=>cost.invoice_item_id===row.id).map(fromRow<any>)}}),totalTaxes:child.taxes.filter(x=>x.invoice_id===invoice.id).map(x=>({name:x.name,percent:Number(x.percent),amount:Number(x.amount)})),payments:child.payments.filter(x=>x.invoice_id===invoice.id).map(fromRow<InvoicePayment>)})); }
export async function generateInvoiceNumber(code:string){ const prefix=`INV/${code.toUpperCase()}/${new Date().getFullYear()}/`; const {count,error}=await getInsforge().database.from('invoices').select('id',{count:'exact',head:true}).like('invoice_number',`${prefix}%`); assertOk(error); return `${prefix}${String((count||0)+1).padStart(3,'0')}`; }
export async function generateReceiptNumber(code:string){ const prefix=`KWT/${code.toUpperCase()}/${new Date().getFullYear()}/`; const {count,error}=await getInsforge().database.from('invoice_payments').select('id',{count:'exact',head:true}).like('receipt_number',`${prefix}%`); assertOk(error); return `${prefix}${String((count||0)+1).padStart(3,'0')}`; }
export async function addInvoice(value:{invoiceNumber?:string;branchId:string;customerId:string;contractId?:string;issueDate:string;dueDate:string;items:InvoiceItem[];totalDiscountType?:'nominal'|'percentage';totalDiscountValue?:number;totalTaxes?:Array<{name:string;percent:number}>;autoNotification?:boolean;resellerId?:string;commissionModel?:'percentage'|'markup';commissionRate?:number;bofficeNetPrice?:number}):Promise<Invoice>{
  const branch=(await getBranches()).find(x=>x.id===value.branchId); if(!branch)throw new Error('Cabang tidak ditemukan'); const calc=calculateInvoiceTotals(value.items,value.totalDiscountType,value.totalDiscountValue,value.totalTaxes),id=makeId('inv');
  const netBeforeTax=Math.max(0,calc.totalAmount-calc.totalTaxAmount);
  const resellerCommission=value.resellerId&&value.commissionModel==='percentage'?Math.round(netBeforeTax*Number(value.commissionRate||0)/100):value.resellerId&&value.commissionModel==='markup'?Math.max(0,Math.round(netBeforeTax-Number(value.bofficeNetPrice||0))):0;
  const invoice=await insertOne<any>('invoices',{id,invoiceNumber:value.invoiceNumber?.trim()||await generateInvoiceNumber(branch.code),branchId:value.branchId,customerId:value.customerId,contractId:value.contractId,issueDate:value.issueDate,dueDate:value.dueDate,subtotal:calc.subtotal,totalDiscountType:value.totalDiscountType,totalDiscountValue:value.totalDiscountValue,totalDiscountAmount:calc.totalDiscountAmount,totalTaxAmount:calc.totalTaxAmount,totalAmount:calc.totalAmount,totalPaid:0,remainingAmount:calc.totalAmount,status:'belum_dibayar',autoNotification:value.autoNotification??true,resellerId:value.resellerId,commissionModel:value.commissionModel,commissionRate:value.commissionRate,bofficeNetPrice:value.bofficeNetPrice,resellerCommission});
  try {
    const items=value.items.map((item,position)=>{const computed=calc.computedItems[position]; const estimatedHpp=Number(item.estimatedHpp||0)*Number(item.quantity||1); const saleNet=Math.max(0,computed.total-computed.taxAmount); const grossProfit=saleNet-estimatedHpp; return {...item,id:item.id||makeId('item'),invoiceId:id,position,...computed,estimatedHpp,grossProfit,marginPercent:saleNet>0?Number((grossProfit/saleNet*100).toFixed(2)):0};}); const itemRows=items.map(({costComponents,...item}:any)=>toRow(item)); const itemResult=await getInsforge().database.from('invoice_items').insert(itemRows).select(); assertOk(itemResult.error);
    const costs=items.flatMap((item:any)=>((item.costComponents||[]) as any[]).map(cost=>({id:makeId('icost'),invoice_id:id,invoice_item_id:item.id,product_id:item.productId||null,vendor_price_id:cost.vendorPriceId||null,vendor_id:cost.vendorId||null,component_name:cost.componentName,service_variant:cost.serviceVariant||null,estimated_cost:Number(cost.estimatedCost||0)*Number(item.quantity||1),actual_cost:cost.actualCost||null,status:cost.status||'estimated'})));
    if(costs.length){const costResult=await getInsforge().database.from('invoice_item_costs').insert(costs);assertOk(costResult.error);}
    if(calc.computedTotalTaxes.length){const taxes=calc.computedTotalTaxes.map((tax,position)=>({invoice_id:id,position,...tax})); const taxResult=await getInsforge().database.from('invoice_total_taxes').insert(taxes).select();assertOk(taxResult.error);}
    if(value.resellerId&&value.commissionModel&&resellerCommission>0){const commissionResult=await getInsforge().database.from('reseller_commissions').insert([{id:makeId('com'),invoice_id:id,reseller_id:value.resellerId,model:value.commissionModel,rate:value.commissionRate||null,boffice_net_price:value.bofficeNetPrice||null,estimated_amount:resellerCommission,earned_amount:0,paid_amount:0,status:'estimated'}]);assertOk(commissionResult.error);}
    return {...invoice,items,totalTaxes:calc.computedTotalTaxes,payments:[]} as Invoice;
  } catch(error) {
    await getInsforge().database.from('invoices').delete().eq('id',id);
    throw error;
  }
}
export async function recordInvoicePayment(value:{invoiceId:string;amount:number;paymentDate:string;paymentMethod:string;notes?:string;recordedBy?:string}):Promise<{success:boolean;payment?:InvoicePayment;invoice?:Invoice;error?:string}>{
  const invoice=(await getInvoices()).find(x=>x.id===value.invoiceId); if(!invoice)return {success:false,error:'Invoice tidak ditemukan'}; const branch=(await getBranches()).find(x=>x.id===invoice.branchId); if(!branch)return {success:false,error:'Cabang invoice tidak ditemukan'};
  const payment=await insertOne<InvoicePayment>('invoice_payments',{id:makeId('pay'),invoiceId:invoice.id,receiptNumber:await generateReceiptNumber(branch.code),paymentDate:value.paymentDate,amount:value.amount,paymentMethod:value.paymentMethod,notes:value.notes,recordedBy:value.recordedBy||'Admin BOffice'});
  const payments=[...invoice.payments,payment],totalPaid=payments.reduce((s,p)=>s+Number(p.amount),0),remainingAmount=Math.max(0,Number(invoice.totalAmount)-totalPaid),status=totalPaid<=0?'belum_dibayar':totalPaid<Number(invoice.totalAmount)?'dibayar_sebagian':'lunas';
  const updated=await updateOne<Invoice>('invoices',invoice.id,{totalPaid,remainingAmount,status}); return {success:true,payment,invoice:{...updated!,items:invoice.items,totalTaxes:invoice.totalTaxes,payments}};
}

export async function getLeads(){ return list<Lead>('leads'); }
export async function addLead(value:Omit<Lead,'id'|'createdAt'|'updatedAt'>){ return insertOne<Lead>('leads',{...value,id:makeId('lead')}); }
export async function updateLead(id:string,updates:Partial<Lead>){ return updateOne<Lead>('leads',id,{...updates,updatedAt:new Date().toISOString()}); }
export async function getOffices(branchId?:string):Promise<OfficeSpace[]>{ let q:any=getInsforge().database.from('offices').select().limit(MAX_ROWS); if(branchId&&branchId!=='all')q=q.eq('branch_id',branchId); const {data,error}=await q;assertOk(error);return ((data||[]) as any[]).map(fromRow<OfficeSpace>); }

const defaultSettings:AppSettings={kirimdevApiKey:'',kirimdevPhoneNumberId:'',companyName:'BOffice Indonesia',companyAddress:'',companyPhone:'',bankAccountInfo:'',meetingRoomMonthlyFreeHours:8,meetingRoomOverageRatePerHour:90000,autoNotificationEnabled:true,reminderIntervals:[30,14,1]};
export async function getSettings(){ const {data,error}=await getInsforge().database.from('app_settings').select().eq('id','default').maybeSingle();assertOk(error);return data?fromRow<AppSettings>(data as any):defaultSettings; }
export async function updateSettings(settings:Partial<AppSettings>){ const updated=await updateOne<AppSettings>('app_settings','default',settings); return updated||insertOne<AppSettings>('app_settings',{id:'default',...defaultSettings,...settings}); }
export async function getWhatsAppLogs():Promise<WhatsAppLog[]>{ const {data,error}=await getInsforge().database.from('whatsapp_logs').select().order('sent_at',{ascending:false}).limit(MAX_ROWS);assertOk(error);return ((data||[]) as any[]).map(fromRow<WhatsAppLog>); }
export async function addWhatsAppLog(log:WhatsAppLog):Promise<void>{ await insertOne<WhatsAppLog>('whatsapp_logs',log); }
