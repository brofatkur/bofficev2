'use client';

import { useEffect, useMemo, useState } from 'react';
import { Building2, FileText, LogOut, Save, TrendingUp, UploadCloud, Users } from 'lucide-react';

const money=(n:number)=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n||0);
const field='w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500';

export default function PortalPage(){
  const [data,setData]=useState<any>(null);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const load=()=>fetch('/api/portal').then(async r=>({ok:r.ok,out:await r.json()})).then(({ok,out})=>{if(!ok){setError(out.error);if(out.error==='Sesi tidak aktif.')location.href='/login'}else setData(out.data)});
  useEffect(()=>{load()},[]);
  const metrics=useMemo(()=>{
    if(!data)return[];
    if(data.role.role==='customer')return[{label:'Total invoice',value:data.invoices.length,icon:FileText},{label:'Sisa tagihan',value:money(data.invoices.reduce((s:number,x:any)=>s+Number(x.remaining_amount),0)),icon:TrendingUp},{label:'Dokumen',value:data.documents.length,icon:FileText}];
    if(data.role.role==='reseller')return[{label:'Klien',value:new Set(data.invoices.map((x:any)=>x.customer_id)).size,icon:Users},{label:'Omzet diterima',value:money(data.invoices.reduce((s:number,x:any)=>s+Number(x.total_paid),0)),icon:TrendingUp},{label:'Komisi diperoleh',value:money(data.commissions.reduce((s:number,x:any)=>s+Number(x.earned_amount),0)),icon:FileText}];
    const income=data.transactions.filter((x:any)=>x.direction==='income').reduce((s:number,x:any)=>s+Number(x.amount),0),expense=data.transactions.filter((x:any)=>x.direction==='expense').reduce((s:number,x:any)=>s+Number(x.amount),0);
    return[{label:'Properti',value:data.branches.length,icon:Building2},{label:'Penjualan diterima',value:money(income),icon:TrendingUp},{label:'Pengeluaran',value:money(expense),icon:FileText}];
  },[data]);
  const saveProfile=async(e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();const body=Object.fromEntries(new FormData(e.currentTarget));const res=await fetch('/api/portal',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const out=await res.json();setNotice(res.ok?'Profil berhasil diperbarui.':out.error);if(res.ok)load()};
  const upload=async(e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();const form=new FormData(e.currentTarget);form.set('customerId',data.customer.id);const res=await fetch('/api/customer-documents',{method:'POST',body:form});const out=await res.json();setNotice(res.ok?'Dokumen berhasil diunggah dan menunggu verifikasi.':out.error);if(res.ok){e.currentTarget.reset();load()}};
  if(!data)return <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950 text-sm text-white">{error||'Memuat portal...'}</div>;
  const title=data.customer?.company_name||data.partner?.name||data.user.email;
  return <div className="fixed inset-0 z-[90] overflow-y-auto bg-slate-100">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><img src="/logo.webp" alt="BOffice" className="h-8 w-auto"/><button onClick={async()=>{await fetch('/api/auth/sign-out',{method:'POST'});location.href='/login'}} className="flex items-center gap-2 text-xs font-bold text-slate-500"><LogOut className="h-4 w-4"/>Keluar</button></div></header>
    <main className="mx-auto max-w-6xl space-y-6 p-5 lg:p-8">
      <div><p className="text-xs font-bold uppercase tracking-[.2em] text-blue-600">Portal {String(data.role.role).replace('_',' ')}</p><h1 className="mt-1 text-2xl font-extrabold">{title}</h1><p className="text-sm text-slate-500">Informasi yang ditampilkan khusus untuk akun Anda.</p></div>
      {notice&&<div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">{notice}</div>}
      <div className="grid gap-4 md:grid-cols-3">{metrics.map((m:any)=>{const Icon=m.icon;return <div key={m.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Icon className="h-5 w-5 text-blue-600"/><p className="mt-3 text-xs font-bold text-slate-400">{m.label}</p><p className="mt-1 text-xl font-extrabold">{m.value}</p></div>})}</div>
      {data.role.role==='customer'&&<div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={saveProfile} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-extrabold">Lengkapi profil customer</h2><p className="text-xs text-slate-500">Admin BOffice tetap dapat membantu memperbarui data Anda.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><Input name="company_name" label="Nama perusahaan" defaultValue={data.customer.company_name}/><Input name="entity_type" label="Bentuk badan" defaultValue={data.customer.entity_type}/><Input name="pic_name" label="Nama PIC" defaultValue={data.customer.pic_name}/><Input name="phone" label="No. WhatsApp" defaultValue={data.customer.phone}/><Input name="email" label="Email" type="email" defaultValue={data.customer.email}/><Input name="npwp" label="NPWP" defaultValue={data.customer.npwp}/><Input name="nib" label="NIB" defaultValue={data.customer.nib}/><label className="sm:col-span-2 text-xs font-bold">Alamat<textarea name="address" defaultValue={data.customer.address} className={`${field} mt-1`}/></label><label className="sm:col-span-2 text-xs font-bold">Catatan<textarea name="notes" defaultValue={data.customer.notes} className={`${field} mt-1`}/></label></div><button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white"><Save className="h-4 w-4"/>Simpan profil</button></form>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-extrabold">Dokumen persyaratan</h2><p className="text-xs text-slate-500">PDF, JPG, PNG, atau WebP. Maksimal 10 MB.</p><form onSubmit={upload} className="mt-4 space-y-3 rounded-xl bg-slate-50 p-4"><select name="documentType" className={field}><option value="ktp">KTP</option><option value="passport">Paspor</option><option value="nib">NIB</option><option value="npwp">NPWP</option><option value="sk_ahu">SK AHU</option><option value="akta_notaris">Akta Notaris</option><option value="other">Dokumen lain</option></select><input name="file" type="file" accept=".pdf,image/jpeg,image/png,image/webp" required className="w-full text-xs"/><button className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white"><UploadCloud className="h-4 w-4"/>Unggah dokumen</button></form><div className="mt-4 space-y-2">{data.documents.map((doc:any)=><div key={doc.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-xs"><div><strong>{doc.file_name}</strong><p className="text-slate-400">{String(doc.document_type).toUpperCase()}</p></div><span className="rounded-full bg-slate-100 px-2 py-1 font-bold">{doc.status}</span></div>)}{!data.documents.length&&<p className="py-6 text-center text-xs text-slate-400">Belum ada dokumen.</p>}</div></div>
      </div>}
      <div className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-extrabold">Aktivitas terbaru</h2><div className="mt-4 space-y-2">{data.role.role==='customer'?data.invoices.map((x:any)=><Row key={x.id} title={x.invoice_number} note={`Jatuh tempo ${x.due_date}`} value={money(x.remaining_amount)}/>):data.role.role==='reseller'?data.invoices.map((x:any)=><Row key={x.id} title={x.invoice_number} note={`Terbayar ${money(x.total_paid)}`} value={money(x.reseller_commission)}/>):data.transactions.slice(0,30).map((x:any)=><Row key={x.id} title={x.description} note={x.transaction_date} value={`${x.direction==='income'?'+':'−'} ${money(x.amount)}`}/>)}</div></div>
    </main>
  </div>
}

function Input({label,...props}:any){return <label className="text-xs font-bold">{label}<input {...props} className={`${field} mt-1`}/></label>}
function Row({title,note,value}:{title:string,note:string,value:string}){return <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-xs"><div><strong>{title}</strong><p className="text-slate-400">{note}</p></div><strong>{value}</strong></div>}
