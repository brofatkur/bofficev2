alter table public.bookings
  add column if not exists booker_name text,
  add column if not exists booker_phone text,
  alter column customer_id drop not null;

create extension if not exists btree_gist;

alter table public.bookings
  drop constraint if exists bookings_valid_time;
alter table public.bookings
  add constraint bookings_valid_time check (end_time > start_time);

alter table public.bookings
  drop constraint if exists bookings_no_overlap;
alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (
    room_id with =,
    date with =,
    tsrange(date + start_time, date + end_time, '[)') with &&
  ) where (status <> 'cancelled');

create index if not exists bookings_room_schedule_idx
  on public.bookings (room_id, date, start_time, end_time)
  where status <> 'cancelled';
