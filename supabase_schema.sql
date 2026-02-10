-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Create Enum Types
create type user_role as enum ('admin', 'resident');
create type booking_status as enum ('confirmed', 'cancelled', 'completed');

-- 3. Profiles Table (Links to auth.users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  role user_role default 'resident',
  apartment text
);

-- Function to auto-create profile on new user sign up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, apartment)
  values (new.id, new.raw_user_meta_data->>'full_name', 'resident', new.raw_user_meta_data->>'apartment');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Amenities Table
create table public.amenities (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  capacity int default 1,
  available_from time,
  available_to time,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. App Settings Table (Global Config)
create table public.app_settings (
  key text primary key,
  value jsonb not null
);


-- 6. Bookings Table
create table public.bookings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  amenity_id uuid references public.amenities(id) not null,
  booking_date date not null,
  start_time time not null,
  end_time time not null,
  status booking_status default 'confirmed',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Announcements Table
create table public.announcements (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text not null,
  priority int default 0,
  is_published boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.amenities enable row level security;
alter table public.bookings enable row level security;
alter table public.app_settings enable row level security;
alter table public.announcements enable row level security;

-- 9. RLS Policies

-- Profiles: User can read their own row. Admin can read all.
create policy "User can view their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Admin can view all profiles" on public.profiles for select using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);


-- Amenities: All users can read active amenities. Only Admin can write.
create policy "All users can view active amenities" on public.amenities for select using (is_active = true);
create policy "Admin can manage amenities" on public.amenities for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Announcements: All users can read published announcements. Only Admin can write.
create policy "All users can view published announcements" on public.announcements for select using (is_published = true);
create policy "Admin can manage announcements" on public.announcements for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));


-- Bookings: User can read/create/cancel their own bookings. Admin can read/modify all bookings.
create policy "Users can manage their own bookings" on public.bookings for all using (auth.uid() = user_id);
create policy "Admin can manage all bookings" on public.bookings for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- App Settings: All users can read settings. Only Admin can write.
create policy "All users can view app settings" on public.app_settings for select using (true);
create policy "Admin can manage app settings" on public.app_settings for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));


-- 10. Initial Data (App Settings)
insert into public.app_settings (key, value) values 
('min_hours_advance', '24'),
('max_duration', '4'),
('max_active_bookings', '3');

-- 11. Realtime
alter table public.bookings replica identity full;
create publication supabase_realtime for table public.bookings;
