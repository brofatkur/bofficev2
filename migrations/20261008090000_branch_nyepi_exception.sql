BEGIN;

ALTER TABLE public.branches
  ADD COLUMN IF NOT EXISTS close_on_nyepi boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.enforce_booking_branch_hours()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  schedule public.branch_working_hours%ROWTYPE;
  holiday_name text;
  holiday_open boolean;
  nyepi_closed boolean;
BEGIN
  SELECT open_on_national_holidays, close_on_nyepi
  INTO holiday_open, nyepi_closed
  FROM public.branches WHERE id = NEW.branch_id;

  SELECT name INTO holiday_name
  FROM public.national_holidays WHERE holiday_date = NEW.date;

  IF holiday_name IS NOT NULL AND (
    NOT COALESCE(holiday_open, false)
    OR (COALESCE(nyepi_closed, true) AND holiday_name ILIKE '%Nyepi%')
  ) THEN
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

UPDATE public.branches
SET open_on_national_holidays = true,
    close_on_nyepi = true
WHERE code = 'KUTA-DS';

UPDATE public.branch_working_hours
SET is_open = true,
    open_time = '08:00'::time,
    close_time = '21:00'::time,
    updated_at = now()
WHERE branch_id = (SELECT id FROM public.branches WHERE code = 'KUTA-DS');

COMMIT;
