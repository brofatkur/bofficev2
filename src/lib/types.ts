export type LeadStatus = 'prospect' | 'contacted' | 'negotiation' | 'closed_won' | 'closed_lost';
export type RentalType = 'physical' | 'virtual';
export type BillingCycle = 'monthly' | 'yearly';

export interface Lead {
  id: string;
  name: string;
  companyName: string;
  phone: string; // e.g. +628123456789
  email: string;
  interestType: RentalType;
  billingCycle: BillingCycle;
  estimatedValue: number;
  status: LeadStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfficeSpace {
  id: string;
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

export interface Customer {
  id: string;
  companyName: string;
  picName: string;
  phone: string;
  email: string;
  address: string;
  npwp?: string;
  leadId?: string;
  createdAt: string;
}

export interface Contract {
  id: string;
  contractNumber: string;
  customerId: string;
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

export interface MeetingRoom {
  id: string;
  name: string;
  capacity: number;
  facilities: string[];
  hourlyOverageRate: number; // Default Rp 90,000
}

export interface MeetingBooking {
  id: string;
  roomId: string;
  customerId: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationHours: number;
  isOverage: boolean;
  overageFee: number;
  createdAt: string;
}

// Guest / Attendee Directory
export interface MeetingAttendee {
  id: string;
  phone: string;
  name: string;
  organization: string;
  createdAt: string;
  updatedAt: string;
}

// Attendance Log with Live Stopwatch Check-in / Check-out Tracking
export interface MeetingAttendanceLog {
  id: string;
  attendeeId: string;
  phone: string;
  name: string;
  organization: string;
  roomId: string;
  customerId?: string;
  title?: string;
  checkInTime: string; // ISO String
  checkOutTime?: string; // ISO String
  durationMinutes?: number;
  durationHours?: number;
  status: 'active' | 'completed';
  createdAt: string;
}

export interface InvoiceItem {
  description: string;
  amount: number;
  quantity: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  contractId?: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  status: 'draft' | 'pending' | 'paid' | 'overdue';
  lastWaSentAt?: string;
  createdAt: string;
}

export interface WhatsAppLog {
  id: string;
  recipient: string;
  messageType: 'contract_renewal' | 'invoice' | 'test' | 'custom' | 'attendance';
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
}
