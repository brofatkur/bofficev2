export type LeadStatus = 'prospect' | 'contacted' | 'negotiation' | 'closed_won' | 'closed_lost';
export type RentalType = 'physical' | 'virtual';
export type BillingCycle = 'monthly' | 'yearly';
export type ServiceType = 'virtual_office' | 'private_office';
export type EntityType = 'PT' | 'CV' | 'Perorangan' | 'Yayasan' | 'Firma' | 'Lainnya';
export type TenantStatus = 'calon_tenant' | 'aktif' | 'tidak_aktif';
export type InvoiceStatus = 'belum_dibayar' | 'dibayar_sebagian' | 'lunas';

// Modul 1: Cabang (Branches)
export interface Branch {
  id: string;
  code: string; // e.g. JKT-SUD, JKT-THM, SBY-GUB, DPS-KUT, BDG-DGO
  name: string;
  city: string;
  address: string;
  phone: string;
  status: 'active' | 'inactive';
  publicAttendanceUrl?: string;
  createdAt: string;
  ownershipType?: 'independent' | 'cooperation';
  propertyPartnerId?: string;
  propertySharePercent?: number;
}

// Modul 2: Profil Data Penyewa (Tenant Profile)
export interface Customer {
  id: string;
  companyName: string;
  entityType: EntityType;
  serviceType: ServiceType;
  branchId: string;
  picName: string;
  phone: string;
  email: string;
  address: string;
  npwp?: string;
  nib?: string;
  status: TenantStatus;
  startDate: string;
  notes?: string;
  leadId?: string;
  createdAt: string;
  updatedAt: string;
  userId?: string;
  onboardingStatus?: 'not_invited' | 'invited' | 'active' | 'suspended';
  profileCompletedAt?: string;
}

export type PartnerType = 'property' | 'reseller' | 'vendor';
export type CommissionModel = 'percentage' | 'markup';

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Partner {
  id: string;
  code: string;
  name: string;
  partnerType: PartnerType;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  taxId?: string;
  userId?: string;
  commissionDefaultModel?: CommissionModel;
  commissionDefaultRate?: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  sku: string;
  categoryId: string;
  name: string;
  variantName?: string;
  unit: string;
  description?: string;
  salePrice: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVendorPrice {
  id: string;
  productId: string;
  vendorId: string;
  componentName: string;
  serviceVariant?: string;
  unitCost: number;
  validFrom: string;
  validUntil?: string;
  notes?: string;
  isPreferred: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface FinancialTransaction {
  id: string;
  branchId: string;
  transactionDate: string;
  direction: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  sourceType: 'manual' | 'invoice_payment' | 'vendor_cost' | 'reseller_commission' | 'profit_share' | 'refund';
  sourceId?: string;
  partnerId?: string;
  proofUrl?: string;
  proofKey?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'void';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  name: string;
  companyName: string;
  phone: string;
  email: string;
  interestType: RentalType;
  billingCycle: BillingCycle;
  branchId?: string;
  estimatedValue: number;
  status: LeadStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfficeSpace {
  id: string;
  branchId: string;
  code: string;
  name: string;
  type: RentalType;
  capacity?: number;
  facilities: string[];
  monthlyPrice: number;
  yearlyPrice: number;
  status: 'available' | 'rented' | 'maintenance';
  currentTenantId?: string;
  description?: string;
}

// Modul 3: Booking Ruang Meeting Lintas Cabang
export interface MeetingRoom {
  id: string;
  branchId: string;
  name: string;
  capacity: number;
  facilities: string[];
  hourlyOverageRate: number; // Default Rp 90.000
}

export interface MeetingBooking {
  id: string;
  branchId: string;
  roomId: string;
  customerId: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationHours: number;
  createdBy: 'tenant' | 'admin' | 'sales';
  status: 'confirmed' | 'cancelled';
  isOverage?: boolean;
  overageFee?: number;
  createdAt: string;
}

// Modul 4: Daftar Hadir & Pemakaian Ruang Meeting (Check-In / Check-Out)
export interface MeetingAttendee {
  id: string;
  phone: string; // normalisasi +62 / 08
  name: string;
  organization: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingAttendanceLog {
  id: string;
  attendeeId: string;
  phone: string;
  name: string;
  organization: string;
  branchId: string;
  roomId: string;
  bookingId?: string; // wajib tertaut ke booking yang sedang berlangsung sesuai PRD 5.4!
  title?: string;
  checkInTime: string; // Server ISO string
  checkOutTime?: string; // Server ISO string
  durationMinutes?: number;
  durationHours?: number;
  status: 'active' | 'completed';
  notes?: string;
  createdAt: string;
}

// Modul 5: Manajemen Sewa & Kontrak
export interface Contract {
  id: string;
  contractNumber: string;
  customerId: string;
  branchId: string;
  officeId: string;
  rentalType: RentalType;
  billingCycle: BillingCycle;
  startDate: string;
  endDate: string;
  rentPrice: number;
  autoRenew: boolean;
  status: 'active' | 'expiring_soon' | 'expired' | 'terminated';
  lastWaReminderSentAt?: string;
  createdAt: string;
}

// Modul 6: Invoice & Penagihan (Diskon & Pajak per Item & Total, Pembayaran Bertahap)
export interface InvoiceItem {
  id: string;
  description: string;
  itemType: 'jasa' | 'barang';
  quantity: number;
  amount: number;
  discountType?: 'nominal' | 'percentage';
  discountValue?: number;
  discountAmount: number;
  taxName?: string;
  taxPercent?: number;
  taxAmount: number;
  total: number;
  productId?: string;
  vendorPriceId?: string;
  vendorId?: string;
  estimatedHpp?: number;
  actualHpp?: number;
  grossProfit?: number;
  marginPercent?: number;
  costComponents?: Array<{ vendorPriceId?: string; vendorId?: string; componentName: string; serviceVariant?: string; estimatedCost: number; actualCost?: number; status?: string }>;
}

export interface TotalTaxItem {
  name: string;
  percent: number;
  amount: number;
}

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  receiptNumber: string; // e.g. KWT/JKT-SUD/2026/001
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // Format PRD: INV/[KODE-CABANG]/2026/001
  branchId: string;
  customerId: string;
  contractId?: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  totalDiscountType?: 'nominal' | 'percentage';
  totalDiscountValue?: number;
  totalDiscountAmount: number;
  totalTaxes: TotalTaxItem[];
  totalTaxAmount: number;
  totalAmount: number;
  totalPaid: number;
  remainingAmount: number;
  status: InvoiceStatus;
  autoNotification: boolean;
  lastWaSentAt?: string;
  payments: InvoicePayment[];
  createdAt: string;
  resellerId?: string;
  commissionModel?: CommissionModel;
  commissionRate?: number;
  bofficeNetPrice?: number;
  resellerCommission?: number;
}

export interface WhatsAppLog {
  id: string;
  recipient: string;
  messageType: 'contract_renewal' | 'invoice' | 'test' | 'custom' | 'attendance' | 'receipt';
  content: string;
  status: 'sent' | 'failed' | 'simulated';
  sentAt: string;
  error?: string;
}

export interface AppSettings {
  kirimdevApiKey: string;
  kirimdevPhoneNumberId: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  bankAccountInfo: string;
  meetingRoomMonthlyFreeHours: number; // Default 8
  meetingRoomOverageRatePerHour: number; // Default 90000
  autoNotificationEnabled: boolean;
  reminderIntervals: number[]; // e.g. [30, 14, 1]
}
