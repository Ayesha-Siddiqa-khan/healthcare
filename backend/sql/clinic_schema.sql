-- Run once in the Supabase SQL editor for project zbclosrqqmxxgyrvgawj.
-- Additive only: creates tables if missing and seeds sample data only when both tables are empty.

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  age integer not null check (age between 0 and 120),
  gender text not null check (gender in ('Female', 'Male', 'Other')),
  phone text not null check (char_length(phone) between 3 and 30),
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  starts_at timestamptz not null,
  visit_type text not null default 'Consultation' check (char_length(visit_type) between 1 and 80),
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists appointments_patient_id_idx on public.appointments (patient_id);
create index if not exists appointments_starts_at_idx on public.appointments (starts_at);

-- The FastAPI backend connects with the database URL, so RLS blocks browser/anon API access.
alter table public.patients enable row level security;
alter table public.appointments enable row level security;

do $$
begin
  if not exists (select 1 from public.patients) and not exists (select 1 from public.appointments) then
    insert into public.patients (name, age, gender, phone) values
      ('Amelia Carter', 34, 'Female', '+1 555 010 0101'),
      ('Benjamin Ortiz', 58, 'Male', '+1 555 010 0102'),
      ('Chloe Nguyen', 27, 'Female', '+1 555 010 0103'),
      ('Daniel Okafor', 45, 'Male', '+1 555 010 0104'),
      ('Eva Lindqvist', 67, 'Female', '+1 555 010 0105'),
      ('Farid Haddad', 39, 'Male', '+1 555 010 0106'),
      ('Grace Tanaka', 52, 'Female', '+1 555 010 0107'),
      ('Hugo Martin', 23, 'Male', '+1 555 010 0108'),
      ('Isla Murphy', 41, 'Other', '+1 555 010 0109'),
      ('Jamal Brooks', 73, 'Male', '+1 555 010 0110');

    insert into public.appointments (patient_id, starts_at, visit_type, status)
    select id,
      date_trunc('day', now()) + (n * interval '1 day') + interval '9 hours',
      case when n % 2 = 0 then 'Check-up' else 'Consultation' end,
      case when n % 4 = 0 then 'completed' when n % 5 = 0 then 'cancelled' else 'scheduled' end
    from (select id, row_number() over (order by name) as n from public.patients) p;
  end if;
end $$;
