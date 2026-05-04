-- Run this in Supabase SQL Editor to enable secure admin-only catalogue uploads.

-- 1) Create a table of admin users.
create table if not exists public.admin_users (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create policy "Admins can read admin_users"
on public.admin_users
for select
to authenticated
using (auth.uid() = id);

-- Add each admin user manually (project owner run in SQL editor):
-- insert into public.admin_users (id)
-- select id from auth.users where email = 'admin@example.com'
-- on conflict (id) do nothing;

-- 2) Catalogue metadata table.
create table if not exists public.catalogue_files (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  description text,
  file_name text,
  file_url text not null,
  file_path text not null,
  file_type text not null,
  mime_type text,
  size_bytes bigint,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

alter table public.catalogue_files enable row level security;

create policy "Everyone can read catalogue_files"
on public.catalogue_files
for select
to anon, authenticated
using (true);

create policy "Admins can insert catalogue_files"
on public.catalogue_files
for insert
to authenticated
with check (exists (select 1 from public.admin_users au where au.id = auth.uid()));

create policy "Admins can update catalogue_files"
on public.catalogue_files
for update
to authenticated
using (exists (select 1 from public.admin_users au where au.id = auth.uid()))
with check (exists (select 1 from public.admin_users au where au.id = auth.uid()));

create policy "Admins can delete catalogue_files"
on public.catalogue_files
for delete
to authenticated
using (exists (select 1 from public.admin_users au where au.id = auth.uid()));

-- 3) Category registry table (persists custom categories for future uploads).
create table if not exists public.catalogue_categories (
  name text primary key,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

alter table public.catalogue_categories enable row level security;

drop policy if exists "Everyone can read catalogue_categories" on public.catalogue_categories;
create policy "Everyone can read catalogue_categories"
on public.catalogue_categories
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can insert catalogue_categories" on public.catalogue_categories;
create policy "Admins can insert catalogue_categories"
on public.catalogue_categories
for insert
to authenticated
with check (exists (select 1 from public.admin_users au where au.id = auth.uid()));

drop policy if exists "Admins can update catalogue_categories" on public.catalogue_categories;
create policy "Admins can update catalogue_categories"
on public.catalogue_categories
for update
to authenticated
using (exists (select 1 from public.admin_users au where au.id = auth.uid()))
with check (exists (select 1 from public.admin_users au where au.id = auth.uid()));

drop policy if exists "Admins can delete catalogue_categories" on public.catalogue_categories;
create policy "Admins can delete catalogue_categories"
on public.catalogue_categories
for delete
to authenticated
using (exists (select 1 from public.admin_users au where au.id = auth.uid()));

insert into public.catalogue_categories (name)
select distinct trim(category)
from public.catalogue_files
where nullif(trim(category), '') is not null
on conflict (name) do nothing;

-- 4) Storage bucket (public read, admin write).
insert into storage.buckets (id, name, public)
values ('catalogues', 'catalogues', true)
on conflict (id) do nothing;

create policy "Everyone can read catalogues bucket"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'catalogues');

create policy "Admins can upload catalogues"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'catalogues'
  and exists (select 1 from public.admin_users au where au.id = auth.uid())
);

create policy "Admins can update catalogues"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'catalogues'
  and exists (select 1 from public.admin_users au where au.id = auth.uid())
)
with check (
  bucket_id = 'catalogues'
  and exists (select 1 from public.admin_users au where au.id = auth.uid())
);

create policy "Admins can delete catalogues"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'catalogues'
  and exists (select 1 from public.admin_users au where au.id = auth.uid())
);

-- 5) Gallery images table (admin write, public read).
create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  description text,
  image_url text not null,
  image_path text not null,
  file_name text,
  mime_type text,
  size_bytes bigint,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

alter table public.gallery_images enable row level security;

drop policy if exists "Everyone can read gallery_images" on public.gallery_images;
create policy "Everyone can read gallery_images"
on public.gallery_images
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can insert gallery_images" on public.gallery_images;
create policy "Admins can insert gallery_images"
on public.gallery_images
for insert
to authenticated
with check (exists (select 1 from public.admin_users au where au.id = auth.uid()));

drop policy if exists "Admins can update gallery_images" on public.gallery_images;
create policy "Admins can update gallery_images"
on public.gallery_images
for update
to authenticated
using (exists (select 1 from public.admin_users au where au.id = auth.uid()))
with check (exists (select 1 from public.admin_users au where au.id = auth.uid()));

drop policy if exists "Admins can delete gallery_images" on public.gallery_images;
create policy "Admins can delete gallery_images"
on public.gallery_images
for delete
to authenticated
using (exists (select 1 from public.admin_users au where au.id = auth.uid()));

-- 6) Gallery category registry table (persists custom categories).
create table if not exists public.gallery_categories (
  name text primary key,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

alter table public.gallery_categories enable row level security;

drop policy if exists "Everyone can read gallery_categories" on public.gallery_categories;
create policy "Everyone can read gallery_categories"
on public.gallery_categories
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can insert gallery_categories" on public.gallery_categories;
create policy "Admins can insert gallery_categories"
on public.gallery_categories
for insert
to authenticated
with check (exists (select 1 from public.admin_users au where au.id = auth.uid()));

drop policy if exists "Admins can update gallery_categories" on public.gallery_categories;
create policy "Admins can update gallery_categories"
on public.gallery_categories
for update
to authenticated
using (exists (select 1 from public.admin_users au where au.id = auth.uid()))
with check (exists (select 1 from public.admin_users au where au.id = auth.uid()));

drop policy if exists "Admins can delete gallery_categories" on public.gallery_categories;
create policy "Admins can delete gallery_categories"
on public.gallery_categories
for delete
to authenticated
using (exists (select 1 from public.admin_users au where au.id = auth.uid()));

insert into public.gallery_categories (name)
select distinct trim(category)
from public.gallery_images
where nullif(trim(category), '') is not null
on conflict (name) do nothing;

-- 7) Gallery storage bucket (public read, admin write).
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

drop policy if exists "Everyone can read gallery bucket" on storage.objects;
create policy "Everyone can read gallery bucket"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'gallery');

drop policy if exists "Admins can upload gallery" on storage.objects;
create policy "Admins can upload gallery"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'gallery'
  and exists (select 1 from public.admin_users au where au.id = auth.uid())
);

drop policy if exists "Admins can update gallery" on storage.objects;
create policy "Admins can update gallery"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'gallery'
  and exists (select 1 from public.admin_users au where au.id = auth.uid())
)
with check (
  bucket_id = 'gallery'
  and exists (select 1 from public.admin_users au where au.id = auth.uid())
);

drop policy if exists "Admins can delete gallery" on storage.objects;
create policy "Admins can delete gallery"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'gallery'
  and exists (select 1 from public.admin_users au where au.id = auth.uid())
);

-- Run this in your Supabase SQL Editor
-- It adds the storage_provider column to both tables

ALTER TABLE catalogues
ADD COLUMN IF NOT EXISTS storage_provider TEXT NOT NULL DEFAULT 'supabase';

ALTER TABLE gallery
ADD COLUMN IF NOT EXISTS storage_provider TEXT NOT NULL DEFAULT 'supabase';
