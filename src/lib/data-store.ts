import fs from 'fs';
import path from 'path';
import {
  Lead,
  OfficeSpace,
  Customer,
  Contract,
  MeetingRoom,
  MeetingBooking,
  MeetingAttendee,
  MeetingAttendanceLog,
  Invoice,
  WhatsAppLog,
  AppSettings,
} from './types';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

interface DBData {
  leads: Lead[];
  offices: OfficeSpace[];
  customers: Customer[];
  contracts: Contract[];
  meetingRooms: MeetingRoom[];
  bookings: MeetingBooking[];
  attendees: MeetingAttendee[];
  attendanceLogs: MeetingAttendanceLog[];
  invoices: Invoice[];
  whatsappLogs: WhatsAppLog[];
  settings: AppSettings;
}

const defaultSettings: AppSettings = {
  kirimdevApiKey: 'kdv_live_sample_key_123',
  kirimdevPhoneNumberId: '106540352242922',
  companyName: 'Nusantara Office Center',
  companyAddress: 'Gedung Menara Nusantara Lt. 12, Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan',
  companyPhone: '+628119876543',
  bankAccountInfo: 'BCA 8800-1234-5678 a.n. PT Nusantara Office Center',
  meetingRoomMonthlyFreeHours: 8,
  meetingRoomOverageRatePerHour: 90000,
};

const initialSeed: DBData = {
  settings: defaultSettings,
  leads: [
    {
      id: 'lead_1',
      name: 'Budi Santoso',
      companyName: 'PT Digital Inovasi Bangsa',
      phone: '+6281234567890',
      email: 'budi@digitalinovasi.id',
      interestType: 'physical',
      billingCycle: 'yearly',
      estimatedValue: 120000000,
      status: 'closed_won',
      notes: 'Tertarik sewa Private Office Room 301 untuk 6 orang.',
      createdAt: '2026-08-01T09:00:00.000Z',
      updatedAt: '2026-08-10T14:30:00.000Z',
    },
    {
      id: 'lead_2',
      name: 'Citra Dewi',
      companyName: 'CV Maju Bersama',
      phone: '+6281987654321',
      email: 'citra@majubersama.co.id',
      interestType: 'virtual',
      billingCycle: 'yearly',
      estimatedValue: 6000000,
      status: 'closed_won',
      notes: 'Membutuhkan Virtual Office + Domisili Perusahaan Jakarta.',
      createdAt: '2026-08-05T10:00:00.000Z',
      updatedAt: '2026-08-15T11:00:00.000Z',
    },
  ],
  offices: [
    {
      id: 'off_101',
      code: 'OFC-101',
      name: 'Private Suite Executive 101',
      type: 'physical',
      capacity: 8,
      facilities: ['AC Dedicated', 'High Speed Fiber WiFi', 'Ergonomic Desk & Chair', 'Access 24/7', 'Free Cleaning'],
      monthlyPrice: 15000000,
      yearlyPrice: 160000000,
      status: 'rented',
      currentTenantId: 'cus_1',
      description: 'Ruang kantor privat suite modern dengan pemandangan kota.',
    },
    {
      id: 'vo_gold',
      code: 'VO-GOLD',
      name: 'Virtual Office Gold Plan (Tahunan)',
      type: 'virtual',
      facilities: ['Alamat Bisnis / Domisili Perusahaan', 'Penanganan Surat & Paket', 'Layanan Resepsionis', 'Penggunaan Kuota Meeting Room 8 Jam/Bulan'],
      monthlyPrice: 0,
      yearlyPrice: 6000000,
      status: 'rented',
      currentTenantId: 'cus_2',
      description: 'Paket virtual office terlengkap untuk legalitas dan alamat resmi.',
    },
  ],
  customers: [
    {
      id: 'cus_1',
      companyName: 'PT Digital Inovasi Bangsa',
      picName: 'Budi Santoso',
      phone: '+6281234567890',
      email: 'budi@digitalinovasi.id',
      address: 'Gedung Menara Nusantara Lt. 12 Suite 101, Jakarta',
      npwp: '01.234.567.8-012.000',
      leadId: 'lead_1',
      createdAt: '2026-08-10T14:30:00.000Z',
    },
    {
      id: 'cus_2',
      companyName: 'CV Maju Bersama',
      picName: 'Citra Dewi',
      phone: '+6281987654321',
      email: 'citra@majubersama.co.id',
      address: 'Jl. Kemang Raya No. 45, Jakarta Selatan',
      npwp: '02.987.654.3-098.000',
      leadId: 'lead_2',
      createdAt: '2026-08-15T11:00:00.000Z',
    },
  ],
  contracts: [
    {
      id: 'ctr_1',
      contractNumber: 'CTR/NOC/2025/001',
      customerId: 'cus_1',
      officeId: 'off_101',
      rentalType: 'physical',
      billingCycle: 'yearly',
      startDate: '2025-10-01',
      endDate: '2026-09-30',
      rentPrice: 160000000,
      autoRenew: true,
      status: 'expiring_soon',
      createdAt: '2025-10-01T00:00:00.000Z',
    },
  ],
  meetingRooms: [
    {
      id: 'mr_1',
      name: 'Meeting Room Grand Merapi (12 Pax)',
      capacity: 12,
      facilities: ['Smart TV 65 Inch', 'Video Conference Cam', 'Glass Whiteboard', 'AC', 'Coffee & Tea Service'],
      hourlyOverageRate: 90000,
    },
    {
      id: 'mr_2',
      name: 'Meeting Room Executive Bromo (6 Pax)',
      capacity: 6,
      facilities: ['Monitor Display 50 Inch', 'Whiteboard', 'High Speed WiFi'],
      hourlyOverageRate: 90000,
    },
  ],
  bookings: [
    {
      id: 'book_1',
      roomId: 'mr_1',
      customerId: 'cus_1',
      title: 'Monthly Strategy Review PT Digital Inovasi',
      date: '2026-09-01',
      startTime: '09:00',
      endTime: '13:00',
      durationHours: 4,
      isOverage: false,
      overageFee: 0,
      createdAt: '2026-08-30T10:00:00.000Z',
    },
  ],
  attendees: [
    {
      id: 'att_1',
      phone: '081234567890',
      name: 'Budi Santoso',
      organization: 'PT Digital Inovasi Bangsa',
      createdAt: '2026-09-01T09:00:00.000Z',
      updatedAt: '2026-09-01T09:00:00.000Z',
    },
    {
      id: 'att_2',
      phone: '081987654321',
      name: 'Citra Dewi',
      organization: 'CV Maju Bersama',
      createdAt: '2026-09-02T10:00:00.000Z',
      updatedAt: '2026-09-02T10:00:00.000Z',
    },
  ],
  attendanceLogs: [
    {
      id: 'log_seed_1',
      attendeeId: 'att_1',
      phone: '081234567890',
      name: 'Budi Santoso',
      organization: 'PT Digital Inovasi Bangsa',
      roomId: 'mr_1',
      customerId: 'cus_1',
      title: 'Monthly Strategy Review',
      checkInTime: '2026-09-01T09:00:00.000Z',
      checkOutTime: '2026-09-01T13:00:00.000Z',
      durationMinutes: 240,
      durationHours: 4,
      status: 'completed',
      createdAt: '2026-09-01T09:00:00.000Z',
    },
  ],
  invoices: [
    {
      id: 'inv_1',
      invoiceNumber: 'INV/NOC/2026/0901',
      customerId: 'cus_1',
      contractId: 'ctr_1',
      issueDate: '2026-09-01',
      dueDate: '2026-09-10',
      items: [
        {
          description: 'Perpanjangan Sewa Tahunan Private Suite 101 (2026/2027)',
          amount: 160000000,
          quantity: 1,
          total: 160000000,
        },
      ],
      subtotal: 160000000,
      tax: 0,
      totalAmount: 160000000,
      status: 'pending',
      createdAt: '2026-09-01T09:00:00.000Z',
    },
  ],
  whatsappLogs: [],
};

function normalizePhone(phone: string): string {
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

// Getters & Mutators
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
  const index = db.leads.findIndex((l) => l.id === id);
  if (index === -1) return null;
  db.leads[index] = {
    ...db.leads[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  writeDB(db);
  return db.leads[index];
}

export function getOffices(): OfficeSpace[] {
  return readDB().offices;
}

export function getCustomers(): Customer[] {
  return readDB().customers;
}

export function addCustomer(customer: Omit<Customer, 'id' | 'createdAt'>): Customer {
  const db = readDB();
  const newCus: Customer = {
    ...customer,
    id: 'cus_' + Date.now(),
    createdAt: new Date().toISOString(),
  };
  db.customers.unshift(newCus);
  writeDB(db);
  return newCus;
}

export function getContracts(): Contract[] {
  return readDB().contracts;
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

export function getMeetingRooms(): MeetingRoom[] {
  return readDB().meetingRooms;
}

export function getBookings(): MeetingBooking[] {
  return readDB().bookings;
}

export function addBooking(booking: Omit<MeetingBooking, 'id' | 'createdAt' | 'isOverage' | 'overageFee'>): { booking: MeetingBooking; overageAdded: boolean } {
  const db = readDB();
  const settings = db.settings;

  const bookingMonth = booking.date.substring(0, 7);
  const customerBookingsInMonth = db.bookings.filter(
    (b) => b.customerId === booking.customerId && b.date.startsWith(bookingMonth)
  );

  const existingHoursUsed = customerBookingsInMonth.reduce((sum, b) => sum + b.durationHours, 0);
  const freeQuota = settings.meetingRoomMonthlyFreeHours;
  const overageRate = settings.meetingRoomOverageRatePerHour;

  const newTotalHours = existingHoursUsed + booking.durationHours;
  let isOverage = false;
  let overageFee = 0;

  if (newTotalHours > freeQuota) {
    isOverage = true;
    const overageHours = Math.min(booking.durationHours, newTotalHours - freeQuota);
    overageFee = overageHours * overageRate;
  }

  const newBooking: MeetingBooking = {
    ...booking,
    id: 'book_' + Date.now(),
    isOverage,
    overageFee,
    createdAt: new Date().toISOString(),
  };

  db.bookings.unshift(newBooking);
  writeDB(db);

  return { booking: newBooking, overageAdded: isOverage };
}

export function deleteBooking(id: string): boolean {
  const db = readDB();
  const initialLen = db.bookings.length;
  db.bookings = db.bookings.filter((b) => b.id !== id);
  if (db.bookings.length !== initialLen) {
    writeDB(db);
    return true;
  }
  return false;
}

// ATTENDANCE & GUEST DIRECTORY FUNCTIONS
export function getAttendeeByPhone(phone: string): MeetingAttendee | null {
  const db = readDB();
  const clean = normalizePhone(phone);
  return db.attendees.find((a) => normalizePhone(a.phone) === clean) || null;
}

export function upsertAttendee(data: { phone: string; name: string; organization: string }): MeetingAttendee {
  const db = readDB();
  const clean = normalizePhone(data.phone);
  const existingIndex = db.attendees.findIndex((a) => normalizePhone(a.phone) === clean);

  if (existingIndex !== -1) {
    db.attendees[existingIndex] = {
      ...db.attendees[existingIndex],
      name: data.name,
      organization: data.organization,
      updatedAt: new Date().toISOString(),
    };
    writeDB(db);
    return db.attendees[existingIndex];
  }

  const newAttendee: MeetingAttendee = {
    id: 'att_' + Date.now(),
    phone: data.phone,
    name: data.name,
    organization: data.organization,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.attendees.unshift(newAttendee);
  writeDB(db);
  return newAttendee;
}

export function getActiveAttendanceByPhone(phone: string): MeetingAttendanceLog | null {
  const db = readDB();
  const clean = normalizePhone(phone);
  return (
    db.attendanceLogs.find(
      (log) => normalizePhone(log.phone) === clean && log.status === 'active'
    ) || null
  );
}

export function checkInAttendee(data: {
  phone: string;
  name: string;
  organization: string;
  roomId: string;
  customerId?: string;
  title?: string;
}): { log: MeetingAttendanceLog; attendee: MeetingAttendee } {
  const db = readDB();
  const attendee = upsertAttendee({ phone: data.phone, name: data.name, organization: data.organization });

  // If already active, return active log
  const activeLog = getActiveAttendanceByPhone(data.phone);
  if (activeLog) {
    return { log: activeLog, attendee };
  }

  const newLog: MeetingAttendanceLog = {
    id: 'log_' + Date.now(),
    attendeeId: attendee.id,
    phone: data.phone,
    name: data.name,
    organization: data.organization,
    roomId: data.roomId,
    customerId: data.customerId,
    title: data.title || 'Penggunaan Meeting Room',
    checkInTime: new Date().toISOString(),
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  db.attendanceLogs.unshift(newLog);
  writeDB(db);

  return { log: newLog, attendee };
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

  // Auto-sync duration to customer bookings if customerId is associated!
  if (log.customerId) {
    const today = now.toISOString().split('T')[0];
    const startTimeStr = checkInDate.toTimeString().substring(0, 5);
    const endTimeStr = now.toTimeString().substring(0, 5);

    addBooking({
      roomId: log.roomId,
      customerId: log.customerId,
      title: `${log.title} (${log.name} - ${log.organization})`,
      date: today,
      startTime: startTimeStr,
      endTime: endTimeStr,
      durationHours,
    });
  }

  writeDB(db);
  return updatedLog;
}

export function getAttendanceLogs(): MeetingAttendanceLog[] {
  return readDB().attendanceLogs;
}

export function getInvoices(): Invoice[] {
  return readDB().invoices;
}

export function addInvoice(invoice: Omit<Invoice, 'id' | 'createdAt'>): Invoice {
  const db = readDB();
  const newInv: Invoice = {
    ...invoice,
    id: 'inv_' + Date.now(),
    createdAt: new Date().toISOString(),
  };
  db.invoices.unshift(newInv);
  writeDB(db);
  return newInv;
}

export function updateInvoice(id: string, updates: Partial<Invoice>): Invoice | null {
  const db = readDB();
  const idx = db.invoices.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  db.invoices[idx] = { ...db.invoices[idx], ...updates };
  writeDB(db);
  return db.invoices[idx];
}

export function getWhatsAppLogs(): WhatsAppLog[] {
  return readDB().whatsappLogs;
}

export function addWhatsAppLog(log: WhatsAppLog) {
  const db = readDB();
  db.whatsappLogs.unshift(log);
  writeDB(db);
}

export function getSettings(): AppSettings {
  return readDB().settings;
}

export function updateSettings(settings: Partial<AppSettings>): AppSettings {
  const db = readDB();
  db.settings = { ...db.settings, ...settings };
  writeDB(db);
  return db.settings;
}

// Calculations & Helpers
export function getCustomerMonthlyMeetingUsage(customerId: string, yearMonth: string): {
  usedHours: number;
  freeHours: number;
  remainingFreeHours: number;
  overageHours: number;
  overageFeeTotal: number;
} {
  const db = readDB();
  const freeHours = db.settings.meetingRoomMonthlyFreeHours;
  const overageRate = db.settings.meetingRoomOverageRatePerHour;

  const bookingsInMonth = db.bookings.filter(
    (b) => b.customerId === customerId && b.date.startsWith(yearMonth)
  );

  const usedHours = bookingsInMonth.reduce((acc, b) => acc + b.durationHours, 0);
  const remainingFreeHours = Math.max(0, freeHours - usedHours);
  const overageHours = Math.max(0, usedHours - freeHours);
  const overageFeeTotal = overageHours * overageRate;

  return {
    usedHours,
    freeHours,
    remainingFreeHours,
    overageHours,
    overageFeeTotal,
  };
}
