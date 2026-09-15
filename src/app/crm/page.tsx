'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  UserCheck,
  Building2,
  Phone,
  Mail,
  DollarSign,
  ArrowRight,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  prospect: { label: 'Prospek', bg: 'bg-slate-100', text: 'text-slate-700' },
  contacted: { label: 'Contacted', bg: 'bg-blue-50', text: 'text-blue-700' },
  negotiation: { label: 'Negotiation', bg: 'bg-purple-50', text: 'text-purple-700' },
  closed_won: { label: 'Closing (Won)', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  closed_lost: { label: 'Belum Closing (Lost)', bg: 'bg-rose-50', text: 'text-rose-700' },
};

export default function CRMPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    companyName: '',
    phone: '',
    email: '',
    interestType: 'physical',
    billingCycle: 'yearly',
    estimatedValue: 12000000,
    status: 'prospect',
    notes: '',
  });

  const [convertingLead, setConvertingLead] = useState<any | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      if (data.success) {
        setLeads(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleAddLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLeadForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setNotice('Lead sales baru berhasil ditambahkan!');
        fetchLeads();
        setNewLeadForm({
          name: '',
          companyName: '',
          phone: '',
          email: '',
          interestType: 'physical',
          billingCycle: 'yearly',
          estimatedValue: 12000000,
          status: 'prospect',
          notes: '',
        });
      }
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchLeads();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConvertLeadToCustomer = async (lead: any) => {
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: lead.companyName,
          picName: lead.name,
          phone: lead.phone,
          email: lead.email,
          address: 'Alamat Perusahaan Customer',
          leadId: lead.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotice(`Berhasil mengubah Lead "${lead.companyName}" menjadi Customer resmi! Status diautomasi ke Closing (Won).`);
        fetchLeads();
      }
    } catch (err: any) {
      alert(`Gagal convert: ${err.message}`);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">CRM Sales & Leads Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola data kontak prospek kantor fisik & virtual office, pantau status closing, dan ubah lead closing menjadi customer.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Lead Baru</span>
        </button>
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

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, perusahaan, WA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {['all', 'prospect', 'contacted', 'negotiation', 'closed_won', 'closed_lost'].map((statusKey) => (
            <button
              key={statusKey}
              onClick={() => setFilterStatus(statusKey)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filterStatus === statusKey
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {statusKey === 'all' ? 'Semua Status' : STATUS_LABELS[statusKey]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leads Table / Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Memuat data lead sales...</div>
      ) : filteredLeads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
          Tidak ada lead yang sesuai dengan filter.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="p-4">Perusahaan / PIC</th>
                  <th className="p-4">Kontak (WhatsApp)</th>
                  <th className="p-4">Peminatan Kantor</th>
                  <th className="p-4">Est. Value</th>
                  <th className="p-4">Status Closing</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => {
                  const statusInfo = STATUS_LABELS[lead.status] || STATUS_LABELS.prospect;
                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{lead.companyName}</div>
                        <div className="text-slate-500 text-[11px] font-medium flex items-center gap-1 mt-0.5">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>{lead.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{lead.phone}</span>
                        </div>
                        <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                          <Mail className="w-3.5 h-3.5" />
                          <span>{lead.email}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          lead.interestType === 'physical' ? 'bg-emerald-50 text-emerald-700' : 'bg-teal-50 text-teal-700'
                        }`}>
                          {lead.interestType === 'physical' ? 'Kantor Fisik' : 'Virtual Office'} ({lead.billingCycle})
                        </span>
                        {lead.notes && (
                          <div className="text-[11px] text-slate-400 mt-1 max-w-xs truncate" title={lead.notes}>
                            {lead.notes}
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-bold text-slate-800">
                        Rp {lead.estimatedValue?.toLocaleString('id-ID')}
                      </td>
                      <td className="p-4">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${statusInfo.bg} ${statusInfo.text}`}
                        >
                          <option value="prospect">Prospek</option>
                          <option value="contacted">Contacted</option>
                          <option value="negotiation">Negotiation</option>
                          <option value="closed_won">Closing (Won)</option>
                          <option value="closed_lost">Belum Closing (Lost)</option>
                        </select>
                      </td>
                      <td className="p-4 text-right">
                        {lead.status === 'closed_won' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Customer Resmi
                          </span>
                        ) : (
                          <button
                            onClick={() => handleConvertLeadToCustomer(lead)}
                            className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] px-3 py-1.5 rounded-lg font-semibold shadow-sm transition-all"
                          >
                            <span>Convert ke Customer</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Tambah Lead Prospek Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLeadSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama PIC Kontak *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={newLeadForm.name}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Perusahaan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Digital Inovasi Bangsa"
                  value={newLeadForm.companyName}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp *</label>
                  <input
                    type="text"
                    required
                    placeholder="+62812345678"
                    value={newLeadForm.phone}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="budi@ptdigital.com"
                    value={newLeadForm.email}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Peminatan Kantor</label>
                  <select
                    value={newLeadForm.interestType}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, interestType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="physical">Kantor Fisik</option>
                    <option value="virtual">Virtual Office (Sewa Tahunan)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Siklus Sewa</label>
                  <select
                    value={newLeadForm.billingCycle}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, billingCycle: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="yearly">Tahunan</option>
                    <option value="monthly">Bulanan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estimasi Nilai Sewa (Rp)</label>
                <input
                  type="number"
                  value={newLeadForm.estimatedValue}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, estimatedValue: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Prospek</label>
                <textarea
                  rows={2}
                  placeholder="Kebutuhan kapasitas meja, fasilitas khusus, dll."
                  value={newLeadForm.notes}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-md shadow-emerald-600/20"
                >
                  Simpan Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
