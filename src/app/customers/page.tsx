'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Send,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Mail,
  X,
  RefreshCw,
  Filter,
  ShieldCheck,
  Clock,
  Check,
  Search,
  UploadCloud,
  Download,
  FileUp,
  FolderLock,
  KeyRound,
} from 'lucide-react';
import Link from 'next/link';
import { csvEscape, parseCsv, type CsvRow } from '@/lib/csv';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [sendingWaId, setSendingWaId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows] = useState<CsvRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [activeCustomer, setActiveCustomer] = useState<any>(null);
  const [customerDocs, setCustomerDocs] = useState<any[]>([]);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteResult, setInviteResult] = useState<any>(null);

  // Add Customer / Contract Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    entityType: 'PT',
    serviceType: 'virtual_office',
    branchId: '',
    picName: '',
    phone: '',
    email: '',
    address: '',
    npwp: '',
    nib: '',
    officeId: '',
    rentalType: 'virtual',
    billingCycle: 'yearly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
    rentPrice: 6000000,
    notes: '',
  });

  const fetchData = async () => {
    try {
      const [cRes, ctrRes, bRes, oRes] = await Promise.all([
        fetch('/api/customers').then((r) => r.json()),
        fetch('/api/contracts').then((r) => r.json()),
        fetch('/api/branches').then((r) => r.json()),
        fetch('/api/offices').then((r) => r.json()),
      ]);
      setCustomers(cRes.data || []);
      setContracts(ctrRes.data || []);
      setBranches(bRes.data || []);
      setOffices(oRes.data || []);

      if (bRes.data?.length) {
        setForm((prev) => ({ ...prev, branchId: bRes.data[0].id }));
      }
      if (oRes.data?.length) {
        setForm((prev) => ({ ...prev, officeId: oRes.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const downloadCustomerTemplate = () => {
    const headers = [
      'company_name',
      'entity_type',
      'service_type',
      'branch_code',
      'pic_name',
      'phone',
      'email',
      'address',
      'npwp',
      'nib',
      'status',
      'start_date',
      'end_date',
      'rent_price',
      'notes',
    ];
    const example = [
      'PT Contoh Bali Solusi',
      'PT',
      'virtual_office',
      'DPS-DIP',
      'Made Arya',
      '081234567890',
      'made@contoh.co.id',
      'Jl. Diponegoro No. 45, Denpasar',
      '01.234.567.8-901.000',
      '1234567890123',
      'aktif',
      '2026-09-16',
      '2027-09-15',
      '4500000',
      'Migrasi sistem lama / Penyewa aktif',
    ];
    const content = [headers, example].map((row) => row.map(csvEscape).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-import-customer-boffice.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  const importCustomers=async()=>{setImporting(true);const res=await fetch('/api/customers/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rows:importRows})});const out=await res.json();setImporting(false);setImportResult(out.data||{errors:[{message:out.error}]});if(out.data?.imported){setNotice(`${out.data.imported} customer berhasil diimpor.`);fetchData()}};
  const openDocuments=async(customer:any)=>{setActiveCustomer(customer);setShowDocuments(true);const out=await fetch(`/api/customer-documents?customerId=${customer.id}`).then(r=>r.json());setCustomerDocs(out.data||[])};
  const uploadDocument=async(e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();const formData=new FormData(e.currentTarget);formData.set('customerId',activeCustomer.id);const res=await fetch('/api/customer-documents',{method:'POST',body:formData});const out=await res.json();if(!res.ok){setNotice(out.error);return}setCustomerDocs([out.data,...customerDocs]);setNotice('Dokumen customer berhasil diunggah.');e.currentTarget.reset()};
  const sendInvite=async(e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();const raw=Object.fromEntries(new FormData(e.currentTarget));const res=await fetch('/api/invitations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...raw,role:'customer',customerId:activeCustomer.id,fullName:activeCustomer.picName,email:activeCustomer.email,phone:activeCustomer.phone})});const out=await res.json();setInviteResult(out.data||{error:out.error});if(out.success)fetchData()};

  const handleVerifyTenant = async (customer: any) => {
    try {
      const res = await fetch('/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: customer.id,
          status: 'aktif',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotice(`Tenant "${customer.companyName}" berhasil diverifikasi dan diaktifkan!`);
        fetchData();
      }
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  };

  const handleSendWaReminder = async (contract: any, customer: any) => {
    setSendingWaId(contract.id);
    setNotice(null);
    try {
      const branch = branches.find((b) => b.id === contract.branchId);
      const message =
        `*PENGINGAT PERPANJANGAN KONTRAK SEWA — BOffice*\n\n` +
        `Yth. Bapak/Ibu ${customer.picName} (${customer.companyName}),\n` +
        `Kami menginformasikan bahwa kontrak sewa layanan Anda di *BOffice ${branch?.name || ''}* akan berakhir pada tanggal *${contract.endDate}*.\n\n` +
        `Mohon konfirmasi perpanjangan sewa Anda agar hak operasional, legalitas domisili, dan kuota Meeting Room 8 jam/bulan tetap aktif tanpa jeda.\n\n` +
        `Terima kasih! 🙏\nTim BOffice Indonesia`;

      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: customer.phone,
          message,
          messageType: 'contract_renewal',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNotice(`Pesan Pengingat Perpanjangan WhatsApp berhasil dikirim ke ${customer.companyName}!`);
        await fetch('/api/contracts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: contract.id,
            status: 'expiring_soon',
            lastWaReminderSentAt: new Date().toISOString(),
          }),
        });
        fetchData();
      } else {
        setNotice(`Gagal: ${data.error}`);
      }
    } catch (err: any) {
      setNotice(`Error: ${err.message}`);
    } finally {
      setSendingWaId(null);
      setTimeout(() => setNotice(null), 5000);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cusRes = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: form.companyName,
          entityType: form.entityType,
          serviceType: form.serviceType,
          branchId: form.branchId,
          picName: form.picName,
          phone: form.phone,
          email: form.email,
          address: form.address,
          npwp: form.npwp,
          nib: form.nib,
          status: 'aktif',
          startDate: form.startDate,
          endDate: form.endDate,
          notes: form.notes,
        }),
      });
      const cusData = await cusRes.json();
      if (!cusData.success) throw new Error(cusData.error);

      // Create Initial Contract
      await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: cusData.data.id,
          branchId: form.branchId,
          officeId: form.officeId,
          rentalType: form.rentalType,
          billingCycle: form.billingCycle,
          startDate: form.startDate,
          endDate: form.endDate,
          rentPrice: form.rentPrice,
        }),
      });

      setShowModal(false);
      setNotice('Data Tenant dan Kontrak Sewa baru berhasil dibuat!');
      fetchData();
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesBranch = selectedBranch === 'all' || c.branchId === selectedBranch;
    const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;
    const matchesSearch =
      c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.picName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);
    return matchesBranch && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Manajemen Customer</h1>
          <p className="text-xs text-slate-500 mt-1">
            Database induk penyewa Virtual Office & Private Office lintas cabang, status verifikasi, dan manajemen siklus kontrak.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>setShowImportModal(true)} className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 flex items-center gap-1.5"><UploadCloud className="h-4 w-4"/>Import massal</button>
          <Link
            href="/register"
            target="_blank"
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all border border-slate-300 flex items-center gap-1.5"
          >
            <span>Tautan Form Registrasi Publik</span>
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Customer</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari perusahaan, PIC, WhatsApp..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold">Cabang:</span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">Semua Cabang</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="calon_tenant">Menunggu Verifikasi</option>
              <option value="aktif">Aktif</option>
              <option value="tidak_aktif">Tidak Aktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tenant Cards Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Memuat data penyewa...</div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
          Tidak ada data tenant yang sesuai dengan filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCustomers.map((customer) => {
            const customerContracts = contracts.filter((c) => c.customerId === customer.id);
            const branch = branches.find((b) => b.id === customer.branchId);
            const isPendingVerification = customer.status === 'calon_tenant';

            return (
              <div
                key={customer.id}
                className={`bg-white rounded-2xl border p-6 shadow-sm space-y-4 transition-all ${
                  isPendingVerification ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {customer.entityType || 'PT'}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base">{customer.companyName}</h3>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400" /> PIC: {customer.picName}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-700 font-bold">
                        <Phone className="w-3.5 h-3.5" /> {customer.phone}
                      </span>
                    </div>
                  </div>

                  {isPendingVerification ? (
                    <button
                      onClick={() => handleVerifyTenant(customer)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg shadow-sm transition-all"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Verifikasi & Aktifkan</span>
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                      Tenant Aktif
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Layanan:</span>
                    <span className="font-bold text-slate-800">
                      {customer.serviceType === 'virtual_office' ? 'Virtual Office' : 'Private Office'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Cabang Domisili:</span>
                    <span className="font-semibold text-blue-700">{branch?.name || 'Cabang BOffice'}</span>
                  </div>
                  {customer.npwp && (
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">NPWP:</span>
                      <span className="font-mono text-[11px]">{customer.npwp}</span>
                    </div>
                  )}
                  {customer.nib && (
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">NIB:</span>
                      <span className="font-mono text-[11px]">{customer.nib}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button onClick={()=>openDocuments(customer)} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50"><FolderLock className="h-3.5 w-3.5 text-blue-600"/>Dokumen persyaratan</button>
                  <button onClick={()=>{setActiveCustomer(customer);setInviteResult(null);setShowInvite(true)}} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50"><KeyRound className="h-3.5 w-3.5 text-indigo-600"/>{customer.userId?'Akun portal aktif':'Undang ke portal'}</button>
                </div>

                {/* Contracts List */}
                <div className="space-y-2.5">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Kontrak Sewa:
                  </div>

                  {customerContracts.length === 0 ? (
                    <div className="text-xs text-slate-400 italic">Belum ada kontrak sewa aktif diterbitkan.</div>
                  ) : (
                    customerContracts.map((contract) => {
                      const isExpiring = contract.status === 'expiring_soon';
                      return (
                        <div
                          key={contract.id}
                          className={`p-3.5 rounded-xl border space-y-2 ${
                            isExpiring ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50/60 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-900">{contract.contractNumber}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                isExpiring ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isExpiring ? '⚠️ Akan Berakhir' : 'Aktif'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600">
                              Masa Sewa: <strong className="text-slate-800">{contract.startDate}</strong> s/d <strong className="text-slate-900">{contract.endDate}</strong>
                            </span>
                            <span className="font-extrabold text-slate-900">
                              Rp {contract.rentPrice?.toLocaleString('id-ID')}
                            </span>
                          </div>

                          <div className="pt-1 flex justify-end">
                            <button
                              onClick={() => handleSendWaReminder(contract, customer)}
                              disabled={sendingWaId === contract.id}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm text-[11px] disabled:opacity-50"
                            >
                              {sendingWaId === contract.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5" />
                              )}
                              <span>Kirim Remind WA H-30/H-14/H-1</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showDocuments&&activeCustomer&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><div><h3 className="font-extrabold">Dokumen {activeCustomer.companyName}</h3><p className="text-xs text-slate-500">PDF/JPG/PNG/WebP, maksimal 10 MB per file.</p></div><button onClick={()=>setShowDocuments(false)}><X className="h-5 w-5"/></button></div><form onSubmit={uploadDocument} className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-[1fr_1fr_auto]"><select name="documentType" className="rounded-xl border border-slate-200 px-3 py-2 text-xs"><option value="ktp">KTP</option><option value="passport">Paspor</option><option value="nib">NIB</option><option value="npwp">NPWP</option><option value="sk_ahu">SK AHU</option><option value="akta_notaris">Akta Notaris</option><option value="other">Dokumen lain</option></select><input name="file" type="file" accept=".pdf,image/jpeg,image/png,image/webp" required className="text-xs"/><button className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white">Unggah</button></form><div className="mt-4 max-h-72 space-y-2 overflow-y-auto">{customerDocs.map(doc=><div key={doc.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs"><div><strong>{doc.fileName}</strong><p className="text-slate-400">{String(doc.documentType).toUpperCase()} • {(Number(doc.fileSize)/1024).toFixed(0)} KB</p></div><span className={`rounded-full px-2 py-1 font-bold ${doc.status==='approved'?'bg-emerald-50 text-emerald-700':doc.status==='rejected'?'bg-rose-50 text-rose-700':'bg-amber-50 text-amber-700'}`}>{doc.status}</span></div>)}{!customerDocs.length&&<p className="p-8 text-center text-xs text-slate-400">Belum ada dokumen.</p>}</div></div></div>}

      {showInvite&&activeCustomer&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><form onSubmit={sendInvite} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><div><h3 className="font-extrabold">Undang customer ke portal</h3><p className="text-xs text-slate-500">Tautan berlaku 24 jam dan password dibuat sendiri.</p></div><button type="button" onClick={()=>setShowInvite(false)}><X className="h-5 w-5"/></button></div><div className="mt-5 rounded-xl bg-slate-50 p-3 text-xs"><strong>{activeCustomer.picName}</strong><p>{activeCustomer.email||'Email belum diisi'} • {activeCustomer.phone}</p></div><label className="mt-4 block text-xs font-bold">Kirim melalui<select name="channel" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5"><option value="whatsapp">WhatsApp</option><option value="email">Email</option><option value="link">Buat tautan saja</option></select></label>{inviteResult&&<div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">{inviteResult.error||<>Undangan dibuat melalui {inviteResult.delivery}.<input readOnly value={inviteResult.inviteUrl} className="mt-2 w-full rounded-lg border px-2 py-1.5"/></>}</div>}<button disabled={!activeCustomer.email} className="mt-5 w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white disabled:opacity-40">Buat dan kirim undangan</button></form></div>}

      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between"><div><h3 className="font-extrabold">Import massal customer & kontrak</h3><p className="text-xs text-slate-500">Mencakup data tenant, cabang, masa sewa (tgl mulai & tgl berakhir kontrak), serta nilai sewa.</p></div><button onClick={()=>setShowImportModal(false)}><X className="h-5 w-5"/></button></div>
            <button onClick={downloadCustomerTemplate} className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 px-3 py-2 text-xs font-bold text-blue-700 transition-all"><Download className="h-4 w-4"/>Unduh template CSV (Lengkap dengan Tgl Berakhir Kontrak)</button>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center hover:border-blue-400"><FileUp className="mb-2 h-7 w-7 text-blue-600"/><span className="text-sm font-bold">Pilih file CSV</span><span className="text-xs text-slate-400">Data ditampilkan dahulu sebelum disimpan</span><input type="file" accept=".csv,text/csv" className="hidden" onChange={async e=>{const f=e.target.files?.[0];if(f){setImportRows(parseCsv(await f.text()));setImportResult(null)}}}/></label>
            {importRows.length>0&&<div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs space-y-1"><strong>{importRows.length} baris siap diimpor</strong><p className="text-slate-600">Perusahaan: <strong>{String(importRows[0]?.company_name||importRows[0]?.nama_perusahaan||'-')}</strong></p><p className="text-slate-500">Masa Sewa: {String(importRows[0]?.start_date||importRows[0]?.tgl_mulai||'-')} s/d {String(importRows[0]?.end_date||importRows[0]?.tgl_berakhir||'Otomatis 1 Thn')}</p></div>}
            {importResult&&<div className="rounded-xl border border-slate-200 p-3 text-xs"><p><strong>{importResult.imported||0}</strong> berhasil, <strong>{importResult.skipped||0}</strong> duplikat, <strong>{importResult.errors?.length||0}</strong> gagal.</p>{importResult.errors?.slice(0,5).map((x:any,i:number)=><p key={i} className="mt-1 text-rose-600">Baris {x.row||'-'}: {x.message}</p>)}</div>}
            <button disabled={!importRows.length||importing} onClick={importCustomers} className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-sm font-bold text-white disabled:opacity-40">{importing?'Mengimpor...':'Import customer'}</button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Tambah Tenant & Kontrak Baru</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Badan Usaha *</label>
                  <select
                    value={form.entityType}
                    onChange={(e) => setForm({ ...form, entityType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="PT">PT</option>
                    <option value="CV">CV</option>
                    <option value="Perorangan">Perorangan</option>
                    <option value="Yayasan">Yayasan</option>
                    <option value="Firma">Firma</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Nama Perusahaan *</label>
                  <input
                    type="text"
                    required
                    placeholder="PT Example Solusi"
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Layanan *</label>
                  <select
                    value={form.serviceType}
                    onChange={(e) => setForm({ ...form, serviceType: e.target.value as any, rentalType: e.target.value === 'virtual_office' ? 'virtual' : 'physical' })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="virtual_office">Virtual Office</option>
                    <option value="private_office">Private Office</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cabang *</label>
                  <select
                    value={form.branchId}
                    onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama PIC *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama PIC"
                    value={form.picName}
                    onChange={(e) => setForm({ ...form, picName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp *</label>
                  <input
                    type="text"
                    required
                    placeholder="081234567890"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email PIC *</label>
                <input
                  type="email"
                  required
                  placeholder="pic@perusahaan.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tgl Mulai Sewa *</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tgl Berakhir Sewa *</label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nilai Sewa (Rp) *</label>
                <input
                  type="number"
                  required
                  value={form.rentPrice}
                  onChange={(e) => setForm({ ...form, rentPrice: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md shadow-blue-600/20"
                >
                  Simpan Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
