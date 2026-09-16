BEGIN;

CREATE TABLE IF NOT EXISTS public.branches (
  id text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  city text NOT NULL,
  address text NOT NULL,
  phone text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  public_attendance_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leads (
  id text PRIMARY KEY,
  name text NOT NULL,
  company_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL DEFAULT '',
  interest_type text NOT NULL CHECK (interest_type IN ('physical','virtual')),
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('monthly','yearly')),
  branch_id text REFERENCES public.branches(id) ON DELETE SET NULL,
  estimated_value numeric(18,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'prospect' CHECK (status IN ('prospect','contacted','negotiation','closed_won','closed_lost')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customers (
  id text PRIMARY KEY,
  company_name text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('PT','CV','Perorangan','Yayasan','Firma','Lainnya')),
  service_type text NOT NULL CHECK (service_type IN ('virtual_office','private_office')),
  branch_id text NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  pic_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  npwp text,
  nib text,
  status text NOT NULL DEFAULT 'calon_tenant' CHECK (status IN ('calon_tenant','aktif','tidak_aktif')),
  start_date date NOT NULL,
  notes text,
  lead_id text REFERENCES public.leads(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.offices (
  id text PRIMARY KEY,
  branch_id text NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('physical','virtual')),
  capacity integer,
  facilities text[] NOT NULL DEFAULT '{}',
  monthly_price numeric(18,2) NOT NULL DEFAULT 0,
  yearly_price numeric(18,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','rented','maintenance')),
  current_tenant_id text REFERENCES public.customers(id) ON DELETE SET NULL,
  description text
);

CREATE TABLE IF NOT EXISTS public.meeting_rooms (
  id text PRIMARY KEY,
  branch_id text NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name text NOT NULL,
  capacity integer NOT NULL DEFAULT 1,
  facilities text[] NOT NULL DEFAULT '{}',
  hourly_overage_rate numeric(18,2) NOT NULL DEFAULT 90000
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id text PRIMARY KEY,
  branch_id text NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  room_id text NOT NULL REFERENCES public.meeting_rooms(id) ON DELETE RESTRICT,
  customer_id text NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  title text NOT NULL,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  duration_hours numeric(8,2) NOT NULL,
  created_by text NOT NULL CHECK (created_by IN ('tenant','admin','sales')),
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled')),
  is_overage boolean NOT NULL DEFAULT false,
  overage_fee numeric(18,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

CREATE TABLE IF NOT EXISTS public.attendees (
  id text PRIMARY KEY,
  phone text NOT NULL UNIQUE,
  name text NOT NULL,
  organization text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.attendance_logs (
  id text PRIMARY KEY,
  attendee_id text NOT NULL REFERENCES public.attendees(id) ON DELETE RESTRICT,
  phone text NOT NULL,
  name text NOT NULL,
  organization text NOT NULL,
  branch_id text NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  room_id text NOT NULL REFERENCES public.meeting_rooms(id) ON DELETE RESTRICT,
  booking_id text REFERENCES public.bookings(id) ON DELETE SET NULL,
  title text,
  check_in_time timestamptz NOT NULL DEFAULT now(),
  check_out_time timestamptz,
  duration_minutes integer,
  duration_hours numeric(8,2),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contracts (
  id text PRIMARY KEY,
  contract_number text NOT NULL UNIQUE,
  customer_id text NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  branch_id text NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  office_id text NOT NULL REFERENCES public.offices(id) ON DELETE RESTRICT,
  rental_type text NOT NULL CHECK (rental_type IN ('physical','virtual')),
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('monthly','yearly')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  rent_price numeric(18,2) NOT NULL,
  auto_renew boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expiring_soon','expired','terminated')),
  last_wa_reminder_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id text PRIMARY KEY,
  invoice_number text NOT NULL UNIQUE,
  branch_id text NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  customer_id text NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  contract_id text REFERENCES public.contracts(id) ON DELETE SET NULL,
  issue_date date NOT NULL,
  due_date date NOT NULL,
  subtotal numeric(18,2) NOT NULL DEFAULT 0,
  total_discount_type text CHECK (total_discount_type IN ('nominal','percentage')),
  total_discount_value numeric(18,2),
  total_discount_amount numeric(18,2) NOT NULL DEFAULT 0,
  total_tax_amount numeric(18,2) NOT NULL DEFAULT 0,
  total_amount numeric(18,2) NOT NULL DEFAULT 0,
  total_paid numeric(18,2) NOT NULL DEFAULT 0,
  remaining_amount numeric(18,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'belum_dibayar' CHECK (status IN ('belum_dibayar','dibayar_sebagian','lunas')),
  auto_notification boolean NOT NULL DEFAULT true,
  last_wa_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (due_date >= issue_date)
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
  id text PRIMARY KEY,
  invoice_id text NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  description text NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('jasa','barang')),
  quantity numeric(12,2) NOT NULL,
  amount numeric(18,2) NOT NULL,
  discount_type text CHECK (discount_type IN ('nominal','percentage')),
  discount_value numeric(18,2),
  discount_amount numeric(18,2) NOT NULL DEFAULT 0,
  tax_name text,
  tax_percent numeric(8,2),
  tax_amount numeric(18,2) NOT NULL DEFAULT 0,
  total numeric(18,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.invoice_total_taxes (
  id bigserial PRIMARY KEY,
  invoice_id text NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  name text NOT NULL,
  percent numeric(8,2) NOT NULL,
  amount numeric(18,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.invoice_payments (
  id text PRIMARY KEY,
  invoice_id text NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  receipt_number text NOT NULL UNIQUE,
  payment_date date NOT NULL,
  amount numeric(18,2) NOT NULL CHECK (amount > 0),
  payment_method text NOT NULL,
  notes text,
  recorded_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
  id text PRIMARY KEY,
  recipient text NOT NULL,
  message_type text NOT NULL CHECK (message_type IN ('contract_renewal','invoice','test','custom','attendance','receipt')),
  content text NOT NULL,
  status text NOT NULL CHECK (status IN ('sent','failed','simulated')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  error text
);

CREATE TABLE IF NOT EXISTS public.app_settings (
  id text PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  kirimdev_api_key text NOT NULL DEFAULT '',
  kirimdev_phone_number_id text NOT NULL DEFAULT '',
  company_name text NOT NULL DEFAULT 'BOffice Indonesia',
  company_address text NOT NULL DEFAULT '',
  company_phone text NOT NULL DEFAULT '',
  bank_account_info text NOT NULL DEFAULT '',
  meeting_room_monthly_free_hours numeric(8,2) NOT NULL DEFAULT 8,
  meeting_room_overage_rate_per_hour numeric(18,2) NOT NULL DEFAULT 90000,
  auto_notification_enabled boolean NOT NULL DEFAULT true,
  reminder_intervals integer[] NOT NULL DEFAULT ARRAY[30,14,1],
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.app_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS customers_branch_idx ON public.customers(branch_id);
CREATE INDEX IF NOT EXISTS customers_phone_idx ON public.customers(phone);
CREATE INDEX IF NOT EXISTS leads_status_idx ON public.leads(status);
CREATE INDEX IF NOT EXISTS offices_branch_idx ON public.offices(branch_id);
CREATE INDEX IF NOT EXISTS meeting_rooms_branch_idx ON public.meeting_rooms(branch_id);
CREATE INDEX IF NOT EXISTS bookings_branch_date_idx ON public.bookings(branch_id, date);
CREATE INDEX IF NOT EXISTS bookings_room_date_idx ON public.bookings(room_id, date);
CREATE INDEX IF NOT EXISTS attendance_logs_branch_created_idx ON public.attendance_logs(branch_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_attendance_per_phone ON public.attendance_logs(phone) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS contracts_branch_status_idx ON public.contracts(branch_id, status);
CREATE INDEX IF NOT EXISTS invoices_branch_created_idx ON public.invoices(branch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS invoice_items_invoice_idx ON public.invoice_items(invoice_id, position);
CREATE INDEX IF NOT EXISTS invoice_payments_invoice_idx ON public.invoice_payments(invoice_id, created_at);

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'branches','leads','customers','offices','meeting_rooms','bookings','attendees',
    'attendance_logs','contracts','invoices','invoice_items','invoice_total_taxes',
    'invoice_payments','whatsapp_logs','app_settings'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', table_name);
    EXECUTE format('GRANT ALL ON TABLE public.%I TO project_admin', table_name);
  END LOOP;
END $$;

GRANT USAGE, SELECT ON SEQUENCE public.invoice_total_taxes_id_seq TO project_admin;

COMMIT;
