-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  name text not null,
  email text not null,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- 2. Trusted Contacts Table
create table public.trusted_contacts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  relationship text,
  phone text not null,
  enabled boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.trusted_contacts enable row level security;
create policy "Users can manage own contacts" on trusted_contacts for all using (auth.uid() = user_id);

-- 3. Journeys Table
create table public.journeys (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  start_lat double precision,
  start_lng double precision,
  destination_name text,
  destination_lat double precision,
  destination_lng double precision,
  expected_duration_minutes integer,
  start_time timestamp with time zone,
  current_lat double precision,
  current_lng double precision,
  confidence_score integer default 100,
  risk_level text default 'SAFE' check (risk_level in ('SAFE', 'CAUTION', 'HIGH_RISK')),
  status text default 'ACTIVE' check (status in ('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

alter table public.journeys enable row level security;
create policy "Users can manage own journeys" on journeys for all using (auth.uid() = user_id);

-- 4. Journey Events Table
create table public.journey_events (
  id uuid default uuid_generate_v4() primary key,
  journey_id uuid references public.journeys(id) on delete cascade not null,
  event_type text not null,
  description text not null,
  severity text not null check (severity in ('info', 'warning', 'critical', 'success')),
  latitude double precision,
  longitude double precision,
  score_change integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.journey_events enable row level security;
create policy "Users can manage own journey events" on journey_events 
for all using (
  exists (select 1 from journeys where journeys.id = journey_events.journey_id and journeys.user_id = auth.uid())
);

-- 5. Safety Checkins Table
create table public.safety_checkins (
  id uuid default uuid_generate_v4() primary key,
  journey_id uuid references public.journeys(id) on delete cascade not null,
  status text default 'PENDING' check (status in ('PENDING', 'SAFE', 'HELP_NEEDED', 'EXPIRED')),
  triggered_at timestamp with time zone default timezone('utc'::text, now()) not null,
  responded_at timestamp with time zone,
  response text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.safety_checkins enable row level security;
create policy "Users can manage own safety checkins" on safety_checkins 
for all using (
  exists (select 1 from journeys where journeys.id = safety_checkins.journey_id and journeys.user_id = auth.uid())
);

-- 6. Incidents Table
create table public.incidents (
  id uuid default uuid_generate_v4() primary key,
  journey_id uuid references public.journeys(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  risk_level text not null,
  triggered_at timestamp with time zone default timezone('utc'::text, now()) not null,
  latitude double precision,
  longitude double precision,
  response_status text default 'OPEN' check (response_status in ('OPEN', 'RESOLVED', 'FALSE_ALARM')),
  trusted_contacts_notified boolean default false,
  resolved_at timestamp with time zone
);

alter table public.incidents enable row level security;
create policy "Users can manage own incidents" on incidents for all using (auth.uid() = user_id);

-- 7. Self Defense Progress Table
create table public.self_defense_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  video_id text not null,
  completed boolean default false,
  progress_percent integer default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.self_defense_progress enable row level security;
create policy "Users can manage own progress" on self_defense_progress for all using (auth.uid() = user_id);

-- Realtime Setup
alter publication supabase_realtime add table journeys;
alter publication supabase_realtime add table journey_events;
alter publication supabase_realtime add table incidents;
alter publication supabase_realtime add table safety_checkins;
