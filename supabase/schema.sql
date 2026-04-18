create extension if not exists pgcrypto;

create table if not exists public.food_entries (
  id uuid primary key default gen_random_uuid(),
  eaten_at date not null,
  food_name text not null,
  place_brand text,
  price text,
  image_url text not null,
  image_path text not null,
  image_width integer not null check (image_width > 0),
  image_height integer not null check (image_height > 0),
  created_at timestamptz not null default now()
);

create index if not exists food_entries_created_at_idx
  on public.food_entries (created_at desc);

create index if not exists food_entries_eaten_at_idx
  on public.food_entries (eaten_at desc);