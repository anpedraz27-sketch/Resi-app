-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Create Enum Types
create type user_role as enum ('admin', 'resident');
create type booking_status as enum ('confirmed', 'cancelled', 'completed');

-- 3. Profiles Table (Links to auth.users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text not null,
  full_name text,
  unit_number text,
  role user_role default 'resident',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Amenities Table
create table public.amenities (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  capacity int default 1,
  icon_name text, -- Store lucide icon name
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Settings Table (Global Config)
create table public.settings (
  id uuid default uuid_generate_v4() primary key,
  key text unique not null,
  value jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Bookings Table
create table public.bookings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  amenity_id uuid references public.amenities(id) not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  status booking_status default 'confirmed',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Notifications Table
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  message text not null,
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.amenities enable row level security;
alter table public.bookings enable row level security;
alter table public.settings enable row level security;
alter table public.notifications enable row level security;

-- 9. RLS Policies

-- Profiles: Users can read their own, Admins can read all
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Amenities: Read by all, Modify by Admin only
create policy "Amenities are viewable by everyone" on public.amenities for select using (true);
create policy "Admins can insert amenities" on public.amenities for insert with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can update amenities" on public.amenities for update using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can delete amenities" on public.amenities for delete using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Bookings: Residents see own, Admins see all
create policy "Users see own bookings" on public.bookings for select using (auth.uid() = user_id or exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Users can create bookings" on public.bookings for insert with check (auth.uid() = user_id or exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Users can update own bookings" on public.bookings for update using (auth.uid() = user_id or exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Settings: Read by all, Modify by Admin only
create policy "Settings viewable by everyone" on public.settings for select using (true);
create policy "Admins manage settings" on public.settings for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Notifications: Read by all, Modify by Admin only
create policy "Notifications viewable by everyone" on public.notifications for select using (true);
create policy "Admins manage notifications" on public.notifications for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- 10. Initial Data (Settings)
insert into public.settings (key, value) values ('booking_lead_time_days', '1');
