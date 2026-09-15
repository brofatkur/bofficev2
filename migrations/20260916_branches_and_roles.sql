BEGIN;

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('super_admin','branch_admin')),
  branch_id text REFERENCES public.branches(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (role = 'super_admin' OR branch_id IS NOT NULL)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.user_roles FROM anon;
GRANT SELECT ON TABLE public.user_roles TO authenticated;
GRANT ALL ON TABLE public.user_roles TO project_admin;

DROP POLICY IF EXISTS user_roles_self_select ON public.user_roles;
CREATE POLICY user_roles_self_select ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

INSERT INTO public.branches (id, code, name, city, address, phone, status, public_attendance_url)
VALUES
  ('br_kuta_dewi_sartika', 'KUTA-DS', 'BOffice Kuta Dewi Sartika', 'Badung', 'Dewi Sartika, Kuta', '0811392146', 'active', '/attendance/KUTA-DS'),
  ('br_denpasar_diponegoro', 'DPS-DIP', 'BOffice Denpasar Diponegoro', 'Denpasar', 'Diponegoro, Denpasar', '0811392146', 'active', '/attendance/DPS-DIP'),
  ('br_denpasar_hasanudin', 'DPS-HAS', 'BOffice Denpasar Hasanudin', 'Denpasar', 'Hasanudin, Denpasar', '0811392146', 'active', '/attendance/DPS-HAS'),
  ('br_denpasar_sanur', 'DPS-SAN', 'BOffice Denpasar Sanur', 'Denpasar', 'Sanur, Denpasar', '0811392146', 'active', '/attendance/DPS-SAN'),
  ('br_denpasar_sanglah', 'DPS-SGL', 'BOffice Denpasar Sanglah', 'Denpasar', 'Sanglah, Denpasar', '0811392146', 'active', '/attendance/DPS-SGL')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  city = EXCLUDED.city,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  status = 'active',
  public_attendance_url = EXCLUDED.public_attendance_url;

INSERT INTO public.meeting_rooms (id, branch_id, name, capacity, facilities, hourly_overage_rate)
SELECT
  'mr_' || branch.id,
  branch.id,
  'Meeting Room ' || branch.name,
  10,
  ARRAY['Smart Display TV','WiFi High Speed','Whiteboard','AC'],
  90000
FROM public.branches branch
WHERE branch.code IN ('KUTA-DS','DPS-DIP','DPS-HAS','DPS-SAN','DPS-SGL')
  AND NOT EXISTS (SELECT 1 FROM public.meeting_rooms room WHERE room.branch_id = branch.id);

COMMIT;
