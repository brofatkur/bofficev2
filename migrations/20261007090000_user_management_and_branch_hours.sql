BEGIN;

ALTER TABLE public.branches
  ADD COLUMN IF NOT EXISTS open_on_national_holidays boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.branch_working_hours (
  id text PRIMARY KEY,
  branch_id text NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_open boolean NOT NULL DEFAULT false,
  open_time time,
  close_time time,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (branch_id, day_of_week),
  CHECK (
    (is_open = false AND open_time IS NULL AND close_time IS NULL)
    OR (is_open = true AND open_time IS NOT NULL AND close_time IS NOT NULL AND open_time < close_time)
  )
);

CREATE TABLE IF NOT EXISTS public.national_holidays (
  holiday_date date PRIMARY KEY,
  name text NOT NULL,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.branch_working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.national_holidays ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.branch_working_hours, public.national_holidays FROM anon, authenticated;
GRANT ALL ON TABLE public.branch_working_hours, public.national_holidays TO project_admin;

INSERT INTO public.branch_working_hours (id, branch_id, day_of_week, is_open, open_time, close_time)
SELECT
  'hours_' || branch.id || '_' || day_number,
  branch.id,
  day_number,
  day_number BETWEEN 1 AND 6,
  CASE WHEN day_number BETWEEN 1 AND 6 THEN '08:00'::time ELSE NULL END,
  CASE WHEN day_number BETWEEN 1 AND 5 THEN '17:00'::time WHEN day_number = 6 THEN '13:00'::time ELSE NULL END
FROM public.branches branch
CROSS JOIN generate_series(0, 6) AS day_number
ON CONFLICT (branch_id, day_of_week) DO NOTHING;

INSERT INTO public.national_holidays (holiday_date, name, source) VALUES
  ('2026-01-01', 'Tahun Baru 2026 Masehi', 'SKB 3 Menteri 2026'),
  ('2026-01-16', 'Isra Mikraj Nabi Muhammad SAW', 'SKB 3 Menteri 2026'),
  ('2026-02-17', 'Tahun Baru Imlek 2577 Kongzili', 'SKB 3 Menteri 2026'),
  ('2026-03-19', 'Hari Suci Nyepi', 'SKB 3 Menteri 2026'),
  ('2026-03-21', 'Idulfitri 1447 H', 'SKB 3 Menteri 2026'),
  ('2026-03-22', 'Idulfitri 1447 H', 'SKB 3 Menteri 2026'),
  ('2026-04-03', 'Wafat Yesus Kristus', 'SKB 3 Menteri 2026'),
  ('2026-04-05', 'Kebangkitan Yesus Kristus', 'SKB 3 Menteri 2026'),
  ('2026-05-01', 'Hari Buruh Internasional', 'SKB 3 Menteri 2026'),
  ('2026-05-14', 'Kenaikan Yesus Kristus', 'SKB 3 Menteri 2026'),
  ('2026-05-27', 'Iduladha 1447 H', 'SKB 3 Menteri 2026'),
  ('2026-05-31', 'Hari Raya Waisak 2570 BE', 'SKB 3 Menteri 2026'),
  ('2026-06-01', 'Hari Lahir Pancasila', 'SKB 3 Menteri 2026'),
  ('2026-06-16', '1 Muharam Tahun Baru Islam 1448 H', 'SKB 3 Menteri 2026'),
  ('2026-08-17', 'Proklamasi Kemerdekaan', 'SKB 3 Menteri 2026'),
  ('2026-08-25', 'Maulid Nabi Muhammad SAW', 'SKB 3 Menteri 2026'),
  ('2026-12-25', 'Kelahiran Yesus Kristus', 'SKB 3 Menteri 2026'),
  ('2027-01-01', 'Tahun Baru 2027 Masehi', 'SKB 3 Menteri 2027'),
  ('2027-01-05', 'Isra Mikraj Nabi Muhammad SAW 1448 H', 'SKB 3 Menteri 2027'),
  ('2027-02-06', 'Tahun Baru Imlek 2578 Kongzili', 'SKB 3 Menteri 2027'),
  ('2027-03-08', 'Hari Suci Nyepi', 'SKB 3 Menteri 2027'),
  ('2027-03-10', 'Idulfitri 1448 H', 'SKB 3 Menteri 2027'),
  ('2027-03-11', 'Idulfitri 1448 H', 'SKB 3 Menteri 2027'),
  ('2027-03-26', 'Wafat Yesus Kristus', 'SKB 3 Menteri 2027'),
  ('2027-03-28', 'Kebangkitan Yesus Kristus', 'SKB 3 Menteri 2027'),
  ('2027-05-01', 'Hari Buruh Internasional', 'SKB 3 Menteri 2027'),
  ('2027-05-06', 'Kenaikan Yesus Kristus', 'SKB 3 Menteri 2027'),
  ('2027-05-17', 'Iduladha 1448 H', 'SKB 3 Menteri 2027'),
  ('2027-05-20', 'Hari Raya Waisak 2571 BE', 'SKB 3 Menteri 2027'),
  ('2027-06-01', 'Hari Lahir Pancasila', 'SKB 3 Menteri 2027'),
  ('2027-06-06', '1 Muharam Tahun Baru Islam 1449 H', 'SKB 3 Menteri 2027'),
  ('2027-08-15', 'Maulid Nabi Muhammad SAW', 'SKB 3 Menteri 2027'),
  ('2027-08-17', 'Proklamasi Kemerdekaan', 'SKB 3 Menteri 2027'),
  ('2027-12-25', 'Kelahiran Yesus Kristus', 'SKB 3 Menteri 2027'),
  ('2027-12-26', 'Isra Mikraj Nabi Muhammad SAW 1449 H', 'SKB 3 Menteri 2027')
ON CONFLICT (holiday_date) DO UPDATE SET name = EXCLUDED.name, source = EXCLUDED.source;

ALTER TABLE public.user_invitations ADD COLUMN IF NOT EXISTS branch_id text REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.user_invitations DROP CONSTRAINT IF EXISTS user_invitations_role_check;
ALTER TABLE public.user_invitations ADD CONSTRAINT user_invitations_role_check CHECK (
  role IN ('super_admin','branch_admin','finance','sales','customer','reseller','property_partner')
);
ALTER TABLE public.user_invitations DROP CONSTRAINT IF EXISTS user_invitations_branch_scope_check;
ALTER TABLE public.user_invitations ADD CONSTRAINT user_invitations_branch_scope_check CHECK (
  role <> 'branch_admin' OR branch_id IS NOT NULL
);

CREATE OR REPLACE FUNCTION public.enforce_booking_branch_hours()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  schedule public.branch_working_hours%ROWTYPE;
  holiday_name text;
  holiday_open boolean;
BEGIN
  SELECT open_on_national_holidays INTO holiday_open
  FROM public.branches WHERE id = NEW.branch_id;

  SELECT name INTO holiday_name
  FROM public.national_holidays WHERE holiday_date = NEW.date;

  IF holiday_name IS NOT NULL AND NOT COALESCE(holiday_open, false) THEN
    RAISE EXCEPTION 'Cabang tutup pada libur nasional: %', holiday_name;
  END IF;

  SELECT * INTO schedule
  FROM public.branch_working_hours
  WHERE branch_id = NEW.branch_id AND day_of_week = EXTRACT(DOW FROM NEW.date)::smallint;

  IF schedule.id IS NULL OR NOT schedule.is_open THEN
    RAISE EXCEPTION 'Cabang tutup pada hari yang dipilih';
  END IF;

  IF NEW.start_time < schedule.open_time OR NEW.end_time > schedule.close_time THEN
    RAISE EXCEPTION 'Booking harus berada dalam jam operasional cabang (%–%)',
      to_char(schedule.open_time, 'HH24:MI'), to_char(schedule.close_time, 'HH24:MI');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_branch_hours_guard ON public.bookings;
CREATE TRIGGER bookings_branch_hours_guard
BEFORE INSERT OR UPDATE OF branch_id, date, start_time, end_time ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.enforce_booking_branch_hours();

COMMIT;
