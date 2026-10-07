ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS meeting_room_monthly_free_hours numeric(8,2) NOT NULL DEFAULT 8,
  DROP CONSTRAINT IF EXISTS customers_meeting_room_quota_check;

ALTER TABLE public.customers
  ADD CONSTRAINT customers_meeting_room_quota_check
  CHECK (meeting_room_monthly_free_hours >= 0 AND meeting_room_monthly_free_hours <= 1000);
