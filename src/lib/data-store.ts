import fs from 'fs';
import path from 'path';
import {
  Branch,
  Customer,
  Lead,
  OfficeSpace,
  MeetingRoom,
  MeetingBooking,
  MeetingAttendee,
  MeetingAttendanceLog,
  Contract,
  Invoice,
  InvoiceItem,
  InvoicePayment,
  TotalTaxItem,
  WhatsAppLog,
  AppSettings,
} from './types';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

interface DBData {
  branches: Branch[];
  customers: Customer[];
  leads: Lead[];
  offices: OfficeSpace[];
  meetingRooms: MeetingRoom[];
  bookings: MeetingBooking[];
  attendees: MeetingAttendee[];
  attendanceLogs: MeetingAttendanceLog[];
  contracts: Contract[];
  invoices: Invoice[];
  whatsappLogs: WhatsAppLog[];
  settings: AppSettings;
}

const defaultSettings: AppSettings = {
  kirimdevApiKey: 'kdv_live_sample_key_123',
  kirimdevPhoneNumberId: '106540352242922',
  companyName: 'BOffice Indonesia',
  companyAddress: 'Gedung Menara BOffice Lt. 15, Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan',
  companyPhone: '+628119876543',
  bankAccountInfo: 'BCA 8800-1234-5678 a.n. PT BOffice Solusi Ruang',
  meetingRoomMonthlyFreeHours: 8,
  meetingRoomOverageRatePerHour: 90000,
  autoNotificationEnabled: true,
  reminderIntervals: [30, 14, 1],
};

const initialSeed: DBData = {
  settings: defaultSettings,
  branches: [
    {
      id: 'br_sudirman',
      code: 'JKT-SUD',
      name: 'BOffice Sudirman Central',
      city: 'Jakarta Selatan',
      address: 'Gedung Menara BOffice Lt. 15, Jl. Jend. Sudirman Kav. 52, Jakarta Selatan',
      phone: '+628119876541',
      status: 'active',
      publicAttendanceUrl: '/attendance/JKT-SUD',
      createdAt: '2026-08-01T08:00:00.000Z',
    },
    {
      id: 'br_thamrin',
      code: 'JKT-THM',
      name: 'BOffice Thamrin Plaza',
      city: 'Jakarta Pusat',
      address: 'Jl. M.H. Thamrin No. 28, Menteng, Jakarta Pusat',
      phone: '+628119876542',
      status: 'active',
      publicAttendanceUrl: '/attendance/JKT-THM',
      createdAt: '2026-08-01T08:00:00.000Z',
    },
    {
      id: 'br_surabaya',
      code: 'SBY-GUB',
      name: 'BOffice Gubeng Surabaya',
      city: 'Surabaya',
      address: 'Jl. Raya Gubeng No. 54, Surabaya, Jawa Timur',
      phone: '+628119876543',
      status: 'active',
      publicAttendanceUrl: '/attendance/SBY-GUB',
      createdAt: '2026-08-01T08:00:00.000Z',
    },
    {
      id: 'br_bali',
      code: 'DPS-KUT',
      name: 'BOffice Sunset Kuta Bali',
      city: 'Badung / Denpasar',
      address: 'Jl. Sunset Road No. 88, Kuta, Bali',
      phone: '+628119876544',
      status: 'active',
      publicAttendanceUrl: '/attendance/DPS-KUT',
      createdAt: '2026-08-01T08:00:00.000Z',
    },
  ],
  customers: [
    {
      id: 'cus_1',
      companyName: 'PT Digital Inovasi Bangsa',
      entityType: 'PT',
      serviceType: 'private_office',
      branchId: 'br_sudirman',
      picName: 'Budi Santoso',
      phone: '081234567890',
      email: 'budi@digitalinovasi.id',
      address: 'Menara BOffice Lt. 15 Suite 101, Sudirman, Jakarta',
      npwp: '01.234.567.8-012.000',
      nib: '9120001234567',
      status: 'aktif',
      startDate: '2025-10-01',
      notes: 'Penyewa Private Office Suite 101 Sudirman',
      createdAt: '2026-08-10T14:30:00.000Z',
      updatedAt: '2026-08-10T14:30:00.000Z',
    },
    {
      id: 'cus_2',
      companyName: 'CV Maju Bersama Makmur',
      entityType: 'CV',
      serviceType: 'virtual_office',
      branchId: 'br_thamrin',
      picName: 'Citra Dewi',
      phone: '081987654321',
      email: 'citra@majubersama.co.id',
      address: 'Jl. Kemang Raya No. 45, Jakarta Selatan',
      npwp: '02.987.654.3-098.000',
      nib: '8120009876543',
      status: 'aktif',
      startDate: '2025-09-15',
      notes: 'Virtual Office Gold Plan Thamrin',
      createdAt: '2026-08-15T11:00:00.000Z',
      updatedAt: '2026-08-15T11:00:00.000Z',
    },
    {
      id: 'cus_3',
      companyName: 'Nusantara Creative Lab',
      entityType: 'Perorangan',
      serviceType: 'virtual_office',
      branchId: 'br_bali',
      picName: 'Wayan Artha',
      phone: '087712345678',
      email: 'wayan@nusantaracreative.com',
      address: 'Jl. Legian No. 12, Kuta, Bali',
      status: 'calon_tenant',
      startDate: '2026-09-15',
      notes: 'Calon penyewa pendaftaran self-input, menunggu verifikasi dokumen KTP/NPWP',
      createdAt: '2026-09-12T10:00:00.000Z',
      updatedAt: '2026-09-12T10:00:00.000Z',
    },
  ],
  leads: [
    {
      id: 'lead_1',
      name: 'Eko Prasetyo',
      companyName: 'StartUp Tech Labs Indonesia',
      phone: '085712345678',
      email: 'eko@startuptech.io',
      interestType: 'physical',
      billingCycle: 'monthly',
      branchId: 'br_sudirman',
      estimatedValue: 18000000,
      status: 'negotiation',
      notes: 'Sedang negosiasi diskon sewa bulanan ruang Suite 102 Sudirman.',
      createdAt: '2026-08-20T13:00:00.000Z',
      updatedAt: '2026-08-28T09:00:00.000Z',
    },
  ],
  offices: [
    {
      id: 'off_sud_101',
      branchId: 'br_sudirman',
      code: 'SUD-PO-101',
      name: 'Executive Suite 101 Sudirman',
      type: 'physical',
      capacity: 8,
      facilities: ['AC Dedicated', 'Fiber High-Speed WiFi', 'Ergonomic Desk 8 Pax', 'Keycard 24/7 Access', 'Free Daily Cleaning'],
      monthlyPrice: 16000000,
      yearlyPrice: 175000000,
      status: 'rented',
      currentTenantId: 'cus_1',
      description: 'Private office suite premium dengan panorama Jalan Sudirman.',
    },
    {
      id: 'off_sud_102',
      branchId: 'br_sudirman',
      code: 'SUD-PO-102',
      name: 'Compact Team Room 102 Sudirman',
      type: 'physical',
      capacity: 4,
      facilities: ['AC', 'WiFi 100Mbps', 'Whiteboard', 'Keycard Access'],
      monthlyPrice: 9000000,
      yearlyPrice: 98000000,
      status: 'available',
      description: 'Ruang kantor privat kompak untuk tim 4 orang.',
    },
    {
      id: 'vo_gold_sud',
      branchId: 'br_sudirman',
      code: 'SUD-VO-GOLD',
      name: 'Virtual Office Gold Plan (Sudirman)',
      type: 'virtual',
      facilities: ['Alamat Domisili Prestisius Sudirman', 'Penanganan Surat & Paket Resmi', 'Resepsionis Profesional', 'Akses Kuota Meeting Room 8 Jam/Bulan'],
      monthlyPrice: 0,
      yearlyPrice: 6500000,
      status: 'available',
      description: 'Paket virtual office prestisius di pusat bisnis Sudirman.',
    },
    {
      id: 'vo_gold_thm',
      branchId: 'br_thamrin',
      code: 'THM-VO-GOLD',
      name: 'Virtual Office Gold Plan (Thamrin)',
      type: 'virtual',
      facilities: ['Alamat Domisili Gedung Thamrin', 'Mail Handling', 'Layanan Surat Domisili', '8 Jam Meeting Room/Bulan Lintas Cabang'],
      monthlyPrice: 0,
      yearlyPrice: 6000000,
      status: 'rented',
      currentTenantId: 'cus_2',
      description: 'Paket virtual office di kawasan MH Thamrin.',
    },
    {
      id: 'vo_gold_dps',
      branchId: 'br_bali',
      code: 'DPS-VO-BALI',
      name: 'Virtual Office Bali Sunset Plan',
      type: 'virtual',
      facilities: ['Alamat Bisnis Kuta Bali', 'Mail & Courier Handling', 'Meeting Room Access'],
      monthlyPrice: 0,
      yearlyPrice: 5000000,
      status: 'available',
      description: 'Paket virtual office di Sunset Road Kuta Bali.',
    },
  ],
  meetingRooms: [
    {
      id: 'mr_sudirman',
      branchId: 'br_sudirman',
      name: 'Meeting Room Sudirman (Merapi)',
      capacity: 12,
      facilities: ['Smart TV 65 Inch 4K', 'Conference Video Bar', 'Glass Whiteboard', 'AC Dual Zone', 'Pantry & Coffee'],
      hourlyOverageRate: 90000,
    },
    {
      id: 'mr_thamrin',
      branchId: 'br_thamrin',
      name: 'Meeting Room Thamrin (Bromo)',
      capacity: 8,
      facilities: ['Smart Monitor 55 Inch', 'WiFi 200Mbps', 'Whiteboard', 'Coffee & Tea'],
      hourlyOverageRate: 90000,
    },
    {
      id: 'mr_surabaya',
      branchId: 'br_surabaya',
      name: 'Meeting Room Surabaya (Semeru)',
      capacity: 10,
      facilities: ['Projector HD', 'Whiteboard', 'Conference Mic', 'AC'],
      hourlyOverageRate: 90000,
    },
    {
      id: 'mr_bali',
      branchId: 'br_bali',
      name: 'Meeting Room Bali (Agung)',
      capacity: 10,
      facilities: ['TV Display 65 Inch', 'High-Speed WiFi', 'Sound System', 'Balinese Coffee'],
      hourlyOverageRate: 90000,
    },
  ],
  bookings: [
    {
      id: 'book_1',
      branchId: 'br_sudirman',
      roomId: 'mr_sudirman',
      customerId: 'cus_1',
      title: 'Strategy & Quarterly Review PT Digital Inovasi',
      date: '2026-09-15',
      startTime: '09:00',
      endTime: '12:00',
      durationHours: 3,
      createdBy: 'tenant',
      status: 'confirmed',
      isOverage: false,
      overageFee: 0,
      createdAt: '2026-09-14T08:00:00.000Z',
    },
    {
      id: 'book_2',
      branchId: 'br_sudirman',
      roomId: 'mr_sudirman',
      customerId: 'cus_1',
      title: 'Client Pitching & Product Demo Session',
      date: '2026-09-15',
      startTime: '13:30',
      endTime: '17:30',
      durationHours: 4,
      createdBy: 'admin',
      status: 'confirmed',
      isOverage: false,
      overageFee: 0,
      createdAt: '2026-09-14T10:00:00.000Z',
    },
    {
      id: 'book_3',
      branchId: 'br_thamrin',
      roomId: 'mr_thamrin',
      customerId: 'cus_2',
      title: 'Rapat Koordinasi Vendor CV Maju Bersama',
      date: '2026-09-15',
      startTime: '10:00',
      endTime: '13:00',
      durationHours: 3,
      createdBy: 'tenant',
      status: 'confirmed',
      isOverage: false,
      overageFee: 0,
      createdAt: '2026-09-13T15:00:00.000Z',
    },
  ],
  attendees: [
    {
      id: 'att_1',
      phone: '081234567890',
      name: 'Budi Santoso',
      organization: 'PT Digital Inovasi Bangsa',
      createdAt: '2026-09-01T08:00:00.000Z',
      updatedAt: '2026-09-01T08:00:00.000Z',
    },
    {
      id: 'att_2',
      phone: '081987654321',
      name: 'Citra Dewi',
      organization: 'CV Maju Bersama Makmur',
      createdAt: '2026-09-02T09:00:00.000Z',
      updatedAt: '2026-09-02T09:00:00.000Z',
    },
  ],
  attendanceLogs: [
    {
      id: 'log_seed_1',
      attendeeId: 'att_1',
      phone: '081234567890',
      name: 'Budi Santoso',
      organization: 'PT Digital Inovasi Bangsa',
      branchId: 'br_sudirman',
      roomId: 'mr_sudirman',
      bookingId: 'book_1',
      title: 'Strategy & Quarterly Review PT Digital Inovasi',
      checkInTime: '2026-09-15T09:02:00.000Z',
      checkOutTime: '2026-09-15T12:05:00.000Z',
      durationMinutes: 183,
      durationHours: 3.05,
      status: 'completed',
      notes: 'Check-in terhubung ke booking book_1',
      createdAt: '2026-09-15T09:02:00.000Z',
    },
  ],
  contracts: [
    {
      id: 'ctr_1',
      contractNumber: 'CTR/BOC-SUD/2025/001',
      customerId: 'cus_1',
      branchId: 'br_sudirman',
      officeId: 'off_sud_101',
      rentalType: 'physical',
      billingCycle: 'yearly',
      startDate: '2025-10-01',
      endDate: '2026-09-30', // Akan berakhir dalam 15 hari!
      rentPrice: 175000000,
      autoRenew: true,
      status: 'expiring_soon',
      lastWaReminderSentAt: '2026-09-01T08:00:00.000Z',
      createdAt: '2025-10-01T00:00:00.000Z',
    },
    {
      id: 'ctr_2',
      contractNumber: 'CTR/BOC-THM/2025/002',
      customerId: 'cus_2',
      branchId: 'br_thamrin',
      officeId: 'vo_gold_thm',
      rentalType: 'virtual',
      billingCycle: 'yearly',
      startDate: '2025-09-20',
      endDate: '2026-09-20', // Akan berakhir dalam 5 hari!
      rentPrice: 6000000,
      autoRenew: false,
      status: 'expiring_soon',
      lastWaReminderSentAt: '2026-09-06T09:00:00.000Z',
      createdAt: '2025-09-20T00:00:00.000Z',
    },
  ],
  invoices: [
    {
      id: 'inv_1',
      invoiceNumber: 'INV/JKT-SUD/2026/001',
      branchId: 'br_sudirman',
      customerId: 'cus_1',
      contractId: 'ctr_1',
      issueDate: '2026-09-01',
      dueDate: '2026-09-25',
      items: [
        {
          id: 'item_1',
          description: 'Perpanjangan Sewa Private Office Suite 101 Sudirman (Periode 2026-2027)',
          itemType: 'jasa',
          quantity: 1,
          amount: 175000000,
          discountType: 'nominal',
          discountValue: 5000000,
          discountAmount: 5000000,
          taxName: 'PPN',
          taxPercent: 11,
          taxAmount: 18700000,
          total: 188700000,
        },
      ],
      subtotal: 188700000,
      totalDiscountAmount: 0,
      totalTaxes: [],
      totalTaxAmount: 0,
      totalAmount: 188700000,
      totalPaid: 100000000,
      remainingAmount: 88700000,
      status: 'dibayar_sebagian',
      autoNotification: true,
      lastWaSentAt: '2026-09-01T09:00:00.000Z',
      payments: [
        {
          id: 'pay_1',
          invoiceId: 'inv_1',
          receiptNumber: 'KWT/JKT-SUD/2026/001',
          paymentDate: '2026-09-05',
          amount: 100000000,
          paymentMethod: 'Transfer Bank BCA',
          notes: 'Pembayaran Termin 1 (DP 50%+)',
          recordedBy: 'Admin Sudirman',
          createdAt: '2026-09-05T11:00:00.000Z',
        },
      ],
      createdAt: '2026-09-01T09:00:00.000Z',
    },
    {
      id: 'inv_2',
      invoiceNumber: 'INV/JKT-THM/2026/001',
      branchId: 'br_thamrin',
      customerId: 'cus_2',
      contractId: 'ctr_2',
      issueDate: '2026-09-02',
      dueDate: '2026-09-20',
      items: [
        {
          id: 'item_2',
          description: 'Perpanjangan Virtual Office Gold Plan Thamrin (1 Tahun)',
          itemType: 'jasa',
          quantity: 1,
          amount: 6000000,
          discountAmount: 0,
          taxName: 'PPN',
          taxPercent: 11,
          taxAmount: 660000,
          total: 6660000,
        },
      ],
      subtotal: 6660000,
      totalDiscountAmount: 0,
      totalTaxes: [],
      totalTaxAmount: 0,
      totalAmount: 6660000,
      totalPaid: 0,
      remainingAmount: 6660000,
      status: 'belum_dibayar',
      autoNotification: true,
      lastWaSentAt: '2026-09-02T10:00:00.000Z',
      payments: [],
      createdAt: '2026-09-02T10:00:00.000Z',
    },
  ],
  whatsappLogs: [],
};

export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('62')) {
    cleaned = '0' + cleaned.substring(2);
  }
  return cleaned;
}

function ensureDbExists() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialSeed, null, 2), 'utf-8');
  }
}

export function readDB(): DBData {
  ensureDbExists();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(raw);
    // Backward compatibility safety checks
    if (!data.branches) data.branches = initialSeed.branches;
    if (!data.customers) data.customers = initialSeed.customers;
    if (!data.invoices) data.invoices = initialSeed.invoices;
    if (!data.bookings) data.bookings = initialSeed.bookings;
    if (!data.attendees) data.attendees = initialSeed.attendees;
    if (!data.attendanceLogs) data.attendanceLogs = initialSeed.attendanceLogs;
    return data;
  } catch {
    return initialSeed;
  }
}

export function writeDB(data: DBData) {
  ensureDbExists();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ----------------------------------------------------
// BRANCHES (Modul 1)
// ----------------------------------------------------
export function getBranches(): Branch[] {
  return readDB().branches;
}

export function getBranchByCode(code: string): Branch | null {
  const db = readDB();
  const c = code.trim().toUpperCase();
  return db.branches.find((b) => b.code.toUpperCase() === c) || null;
}

export function addBranch(branch: Omit<Branch, 'id' | 'createdAt'>): Branch {
  const db = readDB();
  const newB: Branch = {
    ...branch,
    code: branch.code.toUpperCase().trim(),
    id: 'br_' + Date.now(),
    publicAttendanceUrl: `/attendance/${branch.code.toUpperCase().trim()}`,
    createdAt: new Date().toISOString(),
  };
  db.branches.push(newB);

  // Auto-create 1 Meeting Room for this branch if none exists (PRD 5.3)
  const roomExists = db.meetingRooms.some((r) => r.branchId === newB.id);
  if (!roomExists) {
    db.meetingRooms.push({
      id: 'mr_' + newB.id,
      branchId: newB.id,
      name: `Meeting Room ${newB.name}`,
      capacity: 10,
      facilities: ['Smart Display TV', 'WiFi High Speed', 'Whiteboard', 'AC'],
      hourlyOverageRate: 90000,
    });
  }

  writeDB(db);
  return newB;
}

export function updateBranch(id: string, updates: Partial<Branch>): Branch | null {
  const db = readDB();
  const idx = db.branches.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  db.branches[idx] = { ...db.branches[idx], ...updates };
  writeDB(db);
  return db.branches[idx];
}

// ----------------------------------------------------
// TENANTS / CUSTOMERS (Modul 2)
// ----------------------------------------------------
export function getCustomers(branchId?: string): Customer[] {
  const db = readDB();
  if (branchId && branchId !== 'all') {
    return db.customers.filter((c) => c.branchId === branchId);
  }
  return db.customers;
}

export function addCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Customer {
  const db = readDB();
  const newCus: Customer = {
    ...customer,
    phone: normalizePhone(customer.phone),
    id: 'cus_' + Date.now(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.customers.unshift(newCus);
  writeDB(db);
  return newCus;
}

export function updateCustomer(id: string, updates: Partial<Customer>): Customer | null {
  const db = readDB();
  const idx = db.customers.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  db.customers[idx] = {
    ...db.customers[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  writeDB(db);
  return db.customers[idx];
}

// ----------------------------------------------------
// MEETING ROOMS & BOOKINGS (Modul 3)
// ----------------------------------------------------
export function getMeetingRooms(branchId?: string): MeetingRoom[] {
  const db = readDB();
  if (branchId && branchId !== 'all') {
    return db.meetingRooms.filter((r) => r.branchId === branchId);
  }
  return db.meetingRooms;
}

export function getBookings(branchId?: string): MeetingBooking[] {
  const db = readDB();
  if (branchId && branchId !== 'all') {
    return db.bookings.filter((b) => b.branchId === branchId);
  }
  return db.bookings;
}

/**
 * Check if there is any time conflict in the specified branch and room
 */
export function checkBookingConflict(
  branchId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeBookingId?: string
): boolean {
  const db = readDB();
  const bookingsOnDate = db.bookings.filter(
    (b) =>
      b.branchId === branchId &&
      b.date === date &&
      b.status !== 'cancelled' &&
      b.id !== excludeBookingId
  );

  for (const b of bookingsOnDate) {
    // Overlapping condition: (startTime < b.endTime) && (endTime > b.startTime)
    if (startTime < b.endTime && endTime > b.startTime) {
      return true;
    }
  }
  return false;
}

export function addBooking(
  bookingData: Omit<MeetingBooking, 'id' | 'createdAt' | 'status'>
): { success: boolean; booking?: MeetingBooking; error?: string } {
  const db = readDB();

  // Validate conflict
  if (
    checkBookingConflict(
      bookingData.branchId,
      bookingData.date,
      bookingData.startTime,
      bookingData.endTime
    )
  ) {
    return {
      success: false,
      error: 'Bentrok Jadwal! Ruang meeting di cabang ini sudah terisi pada tanggal dan jam tersebut.',
    };
  }

  const newBooking: MeetingBooking = {
    ...bookingData,
    id: 'book_' + Date.now(),
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  };

  db.bookings.unshift(newBooking);
  writeDB(db);
  return { success: true, booking: newBooking };
}

export function cancelBooking(id: string): boolean {
  const db = readDB();
  const idx = db.bookings.findIndex((b) => b.id === id);
  if (idx === -1) return false;
  db.bookings[idx].status = 'cancelled';
  writeDB(db);
  return true;
}

// ----------------------------------------------------
// DAFTAR HADIR / ATTENDANCE & CHECK-IN / CHECK-OUT (Modul 4)
// ----------------------------------------------------
export function getAttendeeByPhone(phone: string): MeetingAttendee | null {
  const db = readDB();
  const clean = normalizePhone(phone);
  return db.attendees.find((a) => normalizePhone(a.phone) === clean) || null;
}

export function upsertAttendee(data: { phone: string; name: string; organization: string }): MeetingAttendee {
  const db = readDB();
  const clean = normalizePhone(data.phone);
  const existingIdx = db.attendees.findIndex((a) => normalizePhone(a.phone) === clean);

  if (existingIdx !== -1) {
    db.attendees[existingIdx] = {
      ...db.attendees[existingIdx],
      name: data.name,
      organization: data.organization,
      updatedAt: new Date().toISOString(),
    };
    writeDB(db);
    return db.attendees[existingIdx];
  }

  const newAtt: MeetingAttendee = {
    id: 'att_' + Date.now(),
    phone: clean,
    name: data.name,
    organization: data.organization,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.attendees.unshift(newAtt);
  writeDB(db);
  return newAtt;
}

/**
 * PRD 5.4: Find ongoing booking at branch matching the current time
 */
export function findOngoingBookingAtBranch(branchId: string, dateStr?: string, timeStr?: string): MeetingBooking | null {
  const db = readDB();
  const now = new Date();
  const targetDate = dateStr || now.toISOString().split('T')[0];
  const targetTime = timeStr || now.toTimeString().substring(0, 5);

  // Check confirmed bookings on that date
  const bookings = db.bookings.filter(
    (b) => b.branchId === branchId && b.date === targetDate && b.status === 'confirmed'
  );

  // Exact ongoing match
  const ongoing = bookings.find((b) => b.startTime <= targetTime && b.endTime >= targetTime);
  if (ongoing) return ongoing;

  // If visitor arrives slightly early (within 30 mins before start)
  const earlyArrival = bookings.find((b) => {
    return b.startTime > targetTime;
  });
  if (earlyArrival) return earlyArrival;

  // Fallback to any booking on that date at this branch
  return bookings[0] || null;
}

export function getActiveAttendanceByPhone(phone: string): MeetingAttendanceLog | null {
  const db = readDB();
  const clean = normalizePhone(phone);
  return db.attendanceLogs.find((l) => normalizePhone(l.phone) === clean && l.status === 'active') || null;
}

export function checkInAttendee(data: {
  phone: string;
  name: string;
  organization: string;
  branchId: string;
  roomId: string;
  bookingId?: string;
  title?: string;
}): { log: MeetingAttendanceLog; attendee: MeetingAttendee; linkedBooking?: MeetingBooking | null } {
  const db = readDB();
  const attendee = upsertAttendee({ phone: data.phone, name: data.name, organization: data.organization });

  // If already active, return active log
  const existingActive = getActiveAttendanceByPhone(data.phone);
  if (existingActive) {
    const linked = db.bookings.find((b) => b.id === existingActive.bookingId) || null;
    return { log: existingActive, attendee, linkedBooking: linked };
  }

  // Auto-link to ongoing booking at branch if not provided (PRD 5.4)
  let linkedBookingId = data.bookingId;
  let linkedBooking = linkedBookingId ? db.bookings.find((b) => b.id === linkedBookingId) || null : null;

  if (!linkedBookingId) {
    linkedBooking = findOngoingBookingAtBranch(data.branchId);
    if (linkedBooking) {
      linkedBookingId = linkedBooking.id;
    }
  }

  const newLog: MeetingAttendanceLog = {
    id: 'log_' + Date.now(),
    attendeeId: attendee.id,
    phone: normalizePhone(data.phone),
    name: data.name,
    organization: data.organization,
    branchId: data.branchId,
    roomId: data.roomId,
    bookingId: linkedBookingId,
    title: data.title || linkedBooking?.title || `Sesi Rapat ${data.organization}`,
    checkInTime: new Date().toISOString(),
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  db.attendanceLogs.unshift(newLog);
  writeDB(db);

  return { log: newLog, attendee, linkedBooking };
}

export function checkOutAttendee(logId: string): MeetingAttendanceLog | null {
  const db = readDB();
  const idx = db.attendanceLogs.findIndex((l) => l.id === logId);
  if (idx === -1) return null;

  const log = db.attendanceLogs[idx];
  const now = new Date();
  const checkInDate = new Date(log.checkInTime);
  const diffMs = Math.max(0, now.getTime() - checkInDate.getTime());
  const durationMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));
  const durationHours = parseFloat((durationMinutes / 60).toFixed(2));

  const updatedLog: MeetingAttendanceLog = {
    ...log,
    checkOutTime: now.toISOString(),
    durationMinutes,
    durationHours,
    status: 'completed',
  };

  db.attendanceLogs[idx] = updatedLog;
  writeDB(db);
  return updatedLog;
}

export function getAttendanceLogs(branchId?: string): MeetingAttendanceLog[] {
  const db = readDB();
  if (branchId && branchId !== 'all') {
    return db.attendanceLogs.filter((l) => l.branchId === branchId);
  }
  return db.attendanceLogs;
}

// ----------------------------------------------------
// KONTRAK & SEWA (Modul 5)
// ----------------------------------------------------
export function getContracts(branchId?: string): Contract[] {
  const db = readDB();
  if (branchId && branchId !== 'all') {
    return db.contracts.filter((c) => c.branchId === branchId);
  }
  return db.contracts;
}

export function addContract(contract: Omit<Contract, 'id' | 'createdAt'>): Contract {
  const db = readDB();
  const newCtr: Contract = {
    ...contract,
    id: 'ctr_' + Date.now(),
    createdAt: new Date().toISOString(),
  };
  db.contracts.unshift(newCtr);
  writeDB(db);
  return newCtr;
}

export function updateContract(id: string, updates: Partial<Contract>): Contract | null {
  const db = readDB();
  const idx = db.contracts.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  db.contracts[idx] = { ...db.contracts[idx], ...updates };
  writeDB(db);
  return db.contracts[idx];
}

// ----------------------------------------------------
// INVOICE & PEMBAYARAN (Modul 6)
// ----------------------------------------------------
export function getInvoices(branchId?: string): Invoice[] {
  const db = readDB();
  if (branchId && branchId !== 'all') {
    return db.invoices.filter((i) => i.branchId === branchId);
  }
  return db.invoices;
}

export function generateInvoiceNumber(branchCode: string): string {
  const db = readDB();
  const year = new Date().getFullYear();
  const prefix = `INV/${branchCode.toUpperCase()}/${year}/`;
  const existingMatches = db.invoices.filter((i) => i.invoiceNumber.startsWith(prefix));
  const nextNum = existingMatches.length + 1;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}

export function generateReceiptNumber(branchCode: string): string {
  const db = readDB();
  const year = new Date().getFullYear();
  const prefix = `KWT/${branchCode.toUpperCase()}/${year}/`;
  let count = 0;
  for (const inv of db.invoices) {
    if (inv.payments) {
      count += inv.payments.filter((p) => p.receiptNumber.startsWith(prefix)).length;
    }
  }
  const nextNum = count + 1;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}

/**
 * Kalkulasi total invoice dengan diskon & pajak per item + diskon & pajak per total
 */
export function calculateInvoiceTotals(
  items: Array<{
    amount: number;
    quantity: number;
    discountType?: 'nominal' | 'percentage';
    discountValue?: number;
    taxPercent?: number;
  }>,
  totalDiscountType?: 'nominal' | 'percentage',
  totalDiscountValue?: number,
  totalTaxes?: Array<{ name: string; percent: number }>
) {
  let subtotal = 0;

  const computedItems = items.map((item, idx) => {
    const gross = item.amount * item.quantity;
    let discAmount = 0;
    if (item.discountType === 'percentage' && item.discountValue) {
      discAmount = (gross * item.discountValue) / 100;
    } else if (item.discountType === 'nominal' && item.discountValue) {
      discAmount = item.discountValue;
    }
    const afterDisc = Math.max(0, gross - discAmount);

    let taxAmount = 0;
    if (item.taxPercent && item.taxPercent > 0) {
      taxAmount = (afterDisc * item.taxPercent) / 100;
    }
    const itemTotal = afterDisc + taxAmount;
    subtotal += itemTotal;

    return {
      discountAmount: discAmount,
      taxAmount,
      total: itemTotal,
    };
  });

  // Total discount on invoice level
  let totalDiscAmount = 0;
  if (totalDiscountType === 'percentage' && totalDiscountValue) {
    totalDiscAmount = (subtotal * totalDiscountValue) / 100;
  } else if (totalDiscountType === 'nominal' && totalDiscountValue) {
    totalDiscAmount = totalDiscountValue;
  }
  const baseAfterTotalDiscount = Math.max(0, subtotal - totalDiscAmount);

  // Total taxes on invoice level
  let totalTaxSum = 0;
  const computedTotalTaxes: TotalTaxItem[] = (totalTaxes || []).map((t) => {
    const amt = (baseAfterTotalDiscount * (t.percent || 0)) / 100;
    totalTaxSum += amt;
    return {
      name: t.name,
      percent: t.percent,
      amount: amt,
    };
  });

  const grandTotal = Math.round(baseAfterTotalDiscount + totalTaxSum);

  return {
    computedItems,
    subtotal: Math.round(subtotal),
    totalDiscountAmount: Math.round(totalDiscAmount),
    computedTotalTaxes,
    totalTaxAmount: Math.round(totalTaxSum),
    totalAmount: grandTotal,
  };
}

export function addInvoice(data: {
  branchId: string;
  customerId: string;
  contractId?: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  totalDiscountType?: 'nominal' | 'percentage';
  totalDiscountValue?: number;
  totalTaxes?: Array<{ name: string; percent: number }>;
  autoNotification?: boolean;
}): Invoice {
  const db = readDB();
  const branch = db.branches.find((b) => b.id === data.branchId) || db.branches[0];
  const invoiceNumber = generateInvoiceNumber(branch.code);

  const calc = calculateInvoiceTotals(
    data.items,
    data.totalDiscountType,
    data.totalDiscountValue,
    data.totalTaxes
  );

  const newItems = data.items.map((it, idx) => ({
    ...it,
    id: it.id || 'it_' + (idx + 1),
    discountAmount: calc.computedItems[idx].discountAmount,
    taxAmount: calc.computedItems[idx].taxAmount,
    total: calc.computedItems[idx].total,
  }));

  const newInvoice: Invoice = {
    id: 'inv_' + Date.now(),
    invoiceNumber,
    branchId: data.branchId,
    customerId: data.customerId,
    contractId: data.contractId,
    issueDate: data.issueDate,
    dueDate: data.dueDate,
    items: newItems,
    subtotal: calc.subtotal,
    totalDiscountType: data.totalDiscountType,
    totalDiscountValue: data.totalDiscountValue,
    totalDiscountAmount: calc.totalDiscountAmount,
    totalTaxes: calc.computedTotalTaxes,
    totalTaxAmount: calc.totalTaxAmount,
    totalAmount: calc.totalAmount,
    totalPaid: 0,
    remainingAmount: calc.totalAmount,
    status: 'belum_dibayar',
    autoNotification: data.autoNotification ?? true,
    payments: [],
    createdAt: new Date().toISOString(),
  };

  db.invoices.unshift(newInvoice);
  writeDB(db);
  return newInvoice;
}

/**
 * Record payment (full or installment) and auto-update invoice status & issue receipt
 */
export function recordInvoicePayment(data: {
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  notes?: string;
  recordedBy?: string;
}): { success: boolean; payment?: InvoicePayment; invoice?: Invoice; error?: string } {
  const db = readDB();
  const idx = db.invoices.findIndex((i) => i.id === data.invoiceId);
  if (idx === -1) return { success: false, error: 'Invoice tidak ditemukan' };

  const invoice = db.invoices[idx];
  const branch = db.branches.find((b) => b.id === invoice.branchId) || db.branches[0];
  const receiptNumber = generateReceiptNumber(branch.code);

  const payment: InvoicePayment = {
    id: 'pay_' + Date.now(),
    invoiceId: invoice.id,
    receiptNumber,
    paymentDate: data.paymentDate,
    amount: data.amount,
    paymentMethod: data.paymentMethod,
    notes: data.notes,
    recordedBy: data.recordedBy || 'Admin BOffice',
    createdAt: new Date().toISOString(),
  };

  if (!invoice.payments) invoice.payments = [];
  invoice.payments.push(payment);

  // Recalculate totals & status (PRD 5.6)
  const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingAmount = Math.max(0, invoice.totalAmount - totalPaid);

  invoice.totalPaid = totalPaid;
  invoice.remainingAmount = remainingAmount;

  if (totalPaid <= 0) {
    invoice.status = 'belum_dibayar';
  } else if (totalPaid < invoice.totalAmount) {
    invoice.status = 'dibayar_sebagian';
  } else {
    invoice.status = 'lunas';
  }

  db.invoices[idx] = invoice;
  writeDB(db);

  return { success: true, payment, invoice };
}

// ----------------------------------------------------
// LEADS & OFFICES
// ----------------------------------------------------
export function getLeads(): Lead[] {
  return readDB().leads;
}

export function addLead(lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Lead {
  const db = readDB();
  const newLead: Lead = {
    ...lead,
    id: 'lead_' + Date.now(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.leads.unshift(newLead);
  writeDB(db);
  return newLead;
}

export function updateLead(id: string, updates: Partial<Lead>): Lead | null {
  const db = readDB();
  const idx = db.leads.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  db.leads[idx] = { ...db.leads[idx], ...updates, updatedAt: new Date().toISOString() };
  writeDB(db);
  return db.leads[idx];
}

export function getOffices(branchId?: string): OfficeSpace[] {
  const db = readDB();
  if (branchId && branchId !== 'all') {
    return db.offices.filter((o) => o.branchId === branchId);
  }
  return db.offices;
}

// ----------------------------------------------------
// SETTINGS & AUDIT LOGS
// ----------------------------------------------------
export function getSettings(): AppSettings {
  return readDB().settings;
}

export function updateSettings(settings: Partial<AppSettings>): AppSettings {
  const db = readDB();
  db.settings = { ...db.settings, ...settings };
  writeDB(db);
  return db.settings;
}

export function getWhatsAppLogs(): WhatsAppLog[] {
  return readDB().whatsappLogs;
}

export function addWhatsAppLog(log: WhatsAppLog) {
  const db = readDB();
  db.whatsappLogs.unshift(log);
  writeDB(db);
}
