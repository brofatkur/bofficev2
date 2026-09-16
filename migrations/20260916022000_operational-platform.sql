-- BOffice operational platform: products, vendors, portals, finance and profit sharing.
-- Additive migration; existing operational data remains intact.

CREATE TABLE IF NOT EXISTS public.product_categories (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.partners (
  id text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  partner_type text NOT NULL CHECK (partner_type IN ('property','reseller','vendor')),
  contact_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  tax_id text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  commission_default_model text CHECK (commission_default_model IN ('percentage','markup')),
  commission_default_rate numeric(8,2) CHECK (commission_default_rate BETWEEN 0 AND 100),
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id text PRIMARY KEY,
  sku text NOT NULL UNIQUE,
  category_id text NOT NULL REFERENCES public.product_categories(id) ON DELETE RESTRICT,
  name text NOT NULL,
  variant_name text,
  unit text NOT NULL DEFAULT 'layanan',
  description text,
  sale_price numeric(18,2) NOT NULL DEFAULT 0 CHECK (sale_price >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_vendor_prices (
  id text PRIMARY KEY,
  product_id text NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  vendor_id text NOT NULL REFERENCES public.partners(id) ON DELETE RESTRICT,
  component_name text NOT NULL,
  service_variant text,
  unit_cost numeric(18,2) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  valid_from date NOT NULL DEFAULT current_date,
  valid_until date,
  notes text,
  is_preferred boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (valid_until IS NULL OR valid_until >= valid_from)
);

ALTER TABLE public.branches
  ADD COLUMN IF NOT EXISTS ownership_type text NOT NULL DEFAULT 'independent',
  ADD COLUMN IF NOT EXISTS property_partner_id text REFERENCES public.partners(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS property_share_percent numeric(8,2) NOT NULL DEFAULT 0;

DO $$ BEGIN
  ALTER TABLE public.branches ADD CONSTRAINT branches_ownership_type_check
    CHECK (ownership_type IN ('independent','cooperation'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.branches ADD CONSTRAINT branches_property_share_check
    CHECK (property_share_percent BETWEEN 0 AND 100);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS onboarding_status text NOT NULL DEFAULT 'not_invited',
  ADD COLUMN IF NOT EXISTS profile_completed_at timestamptz;

DO $$ BEGIN
  ALTER TABLE public.customers ADD CONSTRAINT customers_onboarding_status_check
    CHECK (onboarding_status IN ('not_invited','invited','active','suspended'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.customer_documents (
  id text PRIMARY KEY,
  customer_id text NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('ktp','passport','nib','npwp','sk_ahu','akta_notaris','other')),
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_key text NOT NULL,
  mime_type text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  rejection_reason text,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS reseller_id text REFERENCES public.partners(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS commission_model text,
  ADD COLUMN IF NOT EXISTS commission_rate numeric(8,2),
  ADD COLUMN IF NOT EXISTS boffice_net_price numeric(18,2),
  ADD COLUMN IF NOT EXISTS reseller_commission numeric(18,2) NOT NULL DEFAULT 0;

DO $$ BEGIN
  ALTER TABLE public.invoices ADD CONSTRAINT invoices_commission_model_check
    CHECK (commission_model IS NULL OR commission_model IN ('percentage','markup'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.invoice_items
  ADD COLUMN IF NOT EXISTS product_id text REFERENCES public.products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vendor_price_id text REFERENCES public.product_vendor_prices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vendor_id text REFERENCES public.partners(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS estimated_hpp numeric(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS actual_hpp numeric(18,2),
  ADD COLUMN IF NOT EXISTS gross_profit numeric(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS margin_percent numeric(8,2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.invoice_item_costs (
  id text PRIMARY KEY,
  invoice_id text NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  invoice_item_id text NOT NULL REFERENCES public.invoice_items(id) ON DELETE CASCADE,
  product_id text REFERENCES public.products(id) ON DELETE SET NULL,
  vendor_price_id text REFERENCES public.product_vendor_prices(id) ON DELETE SET NULL,
  vendor_id text REFERENCES public.partners(id) ON DELETE SET NULL,
  component_name text NOT NULL,
  service_variant text,
  estimated_cost numeric(18,2) NOT NULL DEFAULT 0,
  actual_cost numeric(18,2),
  status text NOT NULL DEFAULT 'estimated' CHECK (status IN ('estimated','assigned','completed','billed','paid','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reseller_commissions (
  id text PRIMARY KEY,
  invoice_id text NOT NULL UNIQUE REFERENCES public.invoices(id) ON DELETE CASCADE,
  reseller_id text NOT NULL REFERENCES public.partners(id) ON DELETE RESTRICT,
  model text NOT NULL CHECK (model IN ('percentage','markup')),
  rate numeric(8,2),
  boffice_net_price numeric(18,2),
  estimated_amount numeric(18,2) NOT NULL DEFAULT 0,
  earned_amount numeric(18,2) NOT NULL DEFAULT 0,
  paid_amount numeric(18,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'estimated' CHECK (status IN ('estimated','earned','ready','paid','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id text PRIMARY KEY,
  branch_id text NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  transaction_date date NOT NULL,
  direction text NOT NULL CHECK (direction IN ('income','expense')),
  category text NOT NULL,
  amount numeric(18,2) NOT NULL CHECK (amount > 0),
  description text NOT NULL,
  source_type text NOT NULL DEFAULT 'manual' CHECK (source_type IN ('manual','invoice_payment','vendor_cost','reseller_commission','profit_share','refund')),
  source_id text,
  partner_id text REFERENCES public.partners(id) ON DELETE SET NULL,
  proof_url text,
  proof_key text,
  status text NOT NULL DEFAULT 'approved' CHECK (status IN ('draft','pending','approved','rejected','void')),
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS financial_transactions_source_unique
  ON public.financial_transactions(source_type, source_id)
  WHERE source_id IS NOT NULL AND status <> 'void';

CREATE TABLE IF NOT EXISTS public.branch_profit_share_periods (
  id text PRIMARY KEY,
  branch_id text NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  period_start date NOT NULL,
  period_end date NOT NULL,
  cash_revenue numeric(18,2) NOT NULL DEFAULT 0,
  vendor_hpp numeric(18,2) NOT NULL DEFAULT 0,
  reseller_commission numeric(18,2) NOT NULL DEFAULT 0,
  operating_expense numeric(18,2) NOT NULL DEFAULT 0,
  refunds numeric(18,2) NOT NULL DEFAULT 0,
  distributable_profit numeric(18,2) NOT NULL DEFAULT 0,
  partner_share_percent numeric(8,2) NOT NULL DEFAULT 0,
  partner_share_amount numeric(18,2) NOT NULL DEFAULT 0,
  boffice_share_amount numeric(18,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','closed','paid')),
  closed_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(branch_id, period_start, period_end),
  CHECK (period_end >= period_start)
);

CREATE TABLE IF NOT EXISTS public.user_invitations (
  id text PRIMARY KEY,
  email text NOT NULL,
  phone text,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('customer','reseller','property_partner')),
  customer_id text REFERENCES public.customers(id) ON DELETE CASCADE,
  partner_id text REFERENCES public.partners(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  summary text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_check;
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS customer_id text REFERENCES public.customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS partner_id text REFERENCES public.partners(id) ON DELETE SET NULL;
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_role_check CHECK (role IN (
    'super_admin','branch_admin','finance','sales','customer','reseller','property_partner'
  ));
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_scope_check CHECK (
  role IN ('super_admin','finance','sales','customer','reseller','property_partner')
  OR (role = 'branch_admin' AND branch_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS products_category_idx ON public.products(category_id, is_active);
CREATE INDEX IF NOT EXISTS product_vendor_prices_product_idx ON public.product_vendor_prices(product_id, is_active);
CREATE INDEX IF NOT EXISTS product_vendor_prices_vendor_idx ON public.product_vendor_prices(vendor_id);
CREATE INDEX IF NOT EXISTS partners_type_idx ON public.partners(partner_type, is_active);
CREATE INDEX IF NOT EXISTS partners_user_idx ON public.partners(user_id);
CREATE INDEX IF NOT EXISTS customer_documents_customer_idx ON public.customer_documents(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS customers_user_idx ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS invoices_reseller_idx ON public.invoices(reseller_id);
CREATE INDEX IF NOT EXISTS invoice_item_costs_invoice_idx ON public.invoice_item_costs(invoice_id, invoice_item_id);
CREATE INDEX IF NOT EXISTS invoice_item_costs_vendor_idx ON public.invoice_item_costs(vendor_id, status);
CREATE INDEX IF NOT EXISTS financial_transactions_branch_date_idx ON public.financial_transactions(branch_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS financial_transactions_partner_idx ON public.financial_transactions(partner_id);
CREATE INDEX IF NOT EXISTS profit_share_branch_period_idx ON public.branch_profit_share_periods(branch_id, period_start DESC);
CREATE INDEX IF NOT EXISTS user_roles_customer_idx ON public.user_roles(customer_id);
CREATE INDEX IF NOT EXISTS user_roles_partner_idx ON public.user_roles(partner_id);

CREATE OR REPLACE FUNCTION public.sync_invoice_payment_finance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE inv public.invoices%ROWTYPE;
BEGIN
  SELECT * INTO inv FROM public.invoices WHERE id = NEW.invoice_id;
  INSERT INTO public.financial_transactions (
    id, branch_id, transaction_date, direction, category, amount, description,
    source_type, source_id, status, approved_at
  ) VALUES (
    'fin_' || NEW.id, inv.branch_id, NEW.payment_date, 'income', 'Pembayaran Invoice',
    NEW.amount, 'Pembayaran ' || inv.invoice_number, 'invoice_payment', NEW.id,
    'approved', now()
  ) ON CONFLICT DO NOTHING;

  UPDATE public.reseller_commissions rc
  SET earned_amount = ROUND(rc.estimated_amount * LEAST(1, (inv.total_paid + NEW.amount) / NULLIF(inv.total_amount, 0)), 2),
      status = CASE WHEN (inv.total_paid + NEW.amount) >= inv.total_amount THEN 'ready' ELSE 'earned' END,
      updated_at = now()
  WHERE rc.invoice_id = NEW.invoice_id AND rc.status <> 'cancelled';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS invoice_payment_finance_sync ON public.invoice_payments;
CREATE TRIGGER invoice_payment_finance_sync
AFTER INSERT ON public.invoice_payments
FOR EACH ROW EXECUTE FUNCTION public.sync_invoice_payment_finance();

CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$ SELECT role FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND is_active LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.current_customer_id()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$ SELECT customer_id FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND is_active LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.current_partner_id()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$ SELECT partner_id FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND is_active LIMIT 1 $$;

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'product_categories','partners','products','product_vendor_prices','customer_documents','invoice_item_costs',
    'reseller_commissions','financial_transactions','branch_profit_share_periods',
    'user_invitations','audit_logs'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', table_name);
    EXECUTE format('GRANT ALL ON TABLE public.%I TO project_admin', table_name);
  END LOOP;
END $$;

GRANT USAGE, SELECT ON SEQUENCE public.audit_logs_id_seq TO project_admin;

CREATE POLICY customer_documents_owner_select ON public.customer_documents
  FOR SELECT TO authenticated
  USING (customer_id = public.current_customer_id());
CREATE POLICY customer_documents_owner_insert ON public.customer_documents
  FOR INSERT TO authenticated
  WITH CHECK (customer_id = public.current_customer_id());
GRANT SELECT, INSERT ON public.customer_documents TO authenticated;

CREATE POLICY customer_self_select ON public.customers
  FOR SELECT TO authenticated
  USING (id = public.current_customer_id());
CREATE POLICY customer_self_update ON public.customers
  FOR UPDATE TO authenticated
  USING (id = public.current_customer_id())
  WITH CHECK (id = public.current_customer_id());
GRANT SELECT ON public.customers TO authenticated;
REVOKE UPDATE ON public.customers FROM authenticated;
GRANT UPDATE (company_name, entity_type, pic_name, phone, email, address, npwp, nib, notes, profile_completed_at) ON public.customers TO authenticated;

CREATE POLICY partner_self_select ON public.partners
  FOR SELECT TO authenticated
  USING (id = public.current_partner_id());
GRANT SELECT ON public.partners TO authenticated;

CREATE POLICY reseller_invoice_select ON public.invoices
  FOR SELECT TO authenticated
  USING (
    (public.current_app_role() = 'reseller' AND reseller_id = public.current_partner_id())
    OR (public.current_app_role() = 'customer' AND customer_id = public.current_customer_id())
    OR (public.current_app_role() = 'property_partner' AND branch_id IN (
      SELECT id FROM public.branches WHERE property_partner_id = public.current_partner_id()
    ))
  );
GRANT SELECT ON public.invoices TO authenticated;

CREATE POLICY portal_branch_select ON public.branches
  FOR SELECT TO authenticated
  USING (
    public.current_app_role() IN ('customer','reseller')
    OR (public.current_app_role() = 'property_partner' AND property_partner_id = public.current_partner_id())
  );
GRANT SELECT ON public.branches TO authenticated;

CREATE POLICY portal_invoice_items_select ON public.invoice_items
  FOR SELECT TO authenticated
  USING (invoice_id IN (SELECT id FROM public.invoices));
GRANT SELECT ON public.invoice_items TO authenticated;

CREATE POLICY portal_invoice_payments_select ON public.invoice_payments
  FOR SELECT TO authenticated
  USING (invoice_id IN (SELECT id FROM public.invoices));
GRANT SELECT ON public.invoice_payments TO authenticated;

CREATE POLICY reseller_commission_self_select ON public.reseller_commissions
  FOR SELECT TO authenticated
  USING (reseller_id = public.current_partner_id());
GRANT SELECT ON public.reseller_commissions TO authenticated;

CREATE POLICY reseller_customer_select ON public.customers
  FOR SELECT TO authenticated
  USING (
    public.current_app_role() = 'reseller'
    AND id IN (SELECT customer_id FROM public.invoices WHERE reseller_id = public.current_partner_id())
  );

CREATE POLICY portal_finance_select ON public.financial_transactions
  FOR SELECT TO authenticated
  USING (
    public.current_app_role() = 'property_partner'
    AND branch_id IN (SELECT id FROM public.branches WHERE property_partner_id = public.current_partner_id())
    AND status = 'approved'
  );
GRANT SELECT ON public.financial_transactions TO authenticated;

CREATE POLICY portal_profit_share_select ON public.branch_profit_share_periods
  FOR SELECT TO authenticated
  USING (
    public.current_app_role() = 'property_partner'
    AND branch_id IN (SELECT id FROM public.branches WHERE property_partner_id = public.current_partner_id())
  );
GRANT SELECT ON public.branch_profit_share_periods TO authenticated;

INSERT INTO public.product_categories (id, name, description)
VALUES
  ('cat_jasa', 'Jasa', 'Layanan profesional dan administrasi'),
  ('cat_sewa', 'Sewa', 'Sewa ruang, kantor, dan fasilitas'),
  ('cat_produk', 'Produk', 'Produk fisik atau digital'),
  ('cat_perizinan', 'Perizinan & Legalitas', 'Pendirian badan usaha dan pengurusan izin')
ON CONFLICT (name) DO NOTHING;
