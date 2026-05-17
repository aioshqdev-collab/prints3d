create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'customer',
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references auth.users(id),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  shipping_address text not null,
  shipping_pincode text,
  shipping_district text,
  shipping_distance_km integer,
  status text not null default 'pending',
  subtotal integer not null,
  shipping integer not null,
  total integer not null,
  razorpay_order_id text,
  razorpay_payment_id text,
  created_at timestamptz not null default now()
);

alter table public.orders add column if not exists shipping_pincode text;
alter table public.orders add column if not exists shipping_district text;
alter table public.orders add column if not exists shipping_distance_km integer;

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text,
  item_type text not null check (item_type in ('catalogue', 'custom')),
  name text not null,
  quantity integer not null default 1,
  price integer not null,
  material text,
  color text,
  infill integer,
  quality text,
  stl_file_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.product_inventory (
  product_id text primary key,
  stock integer not null default 0,
  is_preprinted boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.printer_state (
  id integer primary key default 1 check (id = 1),
  is_free boolean not null default true,
  current_queue_id uuid,
  note text,
  updated_at timestamptz not null default now()
);

insert into public.printer_state (id, is_free)
values (1, true)
on conflict (id) do nothing;

create table if not exists public.print_queue (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  order_item_id uuid references public.order_items(id) on delete cascade,
  customer_id uuid references auth.users(id),
  customer_email text not null,
  item_name text not null,
  quantity integer not null default 1,
  stl_file_path text,
  status text not null default 'queued',
  position integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.orders add column if not exists archived_at timestamptz;
alter table public.orders add column if not exists archived_by text;

insert into storage.buckets (id, name, public)
values ('stl-files', 'stl-files', false)
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.product_inventory enable row level security;
alter table public.printer_state enable row level security;
alter table public.print_queue enable row level security;

drop policy if exists "Customers can insert own profile" on public.profiles;
create policy "Customers can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Customers can view own profile" on public.profiles;
create policy "Customers can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Customers can update own profile" on public.profiles;
create policy "Customers can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Customers can view their own orders" on public.orders;
create policy "Customers can view their own orders"
  on public.orders for select
  using (auth.uid() = customer_id);

drop policy if exists "Customers can insert their own orders" on public.orders;
create policy "Customers can insert their own orders"
  on public.orders for insert
  with check (auth.uid() = customer_id or customer_id is null);

drop policy if exists "Customers can view order items for own orders" on public.order_items;
create policy "Customers can view order items for own orders"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and orders.customer_id = auth.uid()
    )
  );

drop policy if exists "Customers can insert order items" on public.order_items;
create policy "Customers can insert order items"
  on public.order_items for insert
  with check (true);

drop policy if exists "Authenticated users can upload STL files" on storage.objects;
create policy "Authenticated users can upload STL files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'stl-files');

drop policy if exists "Authenticated users can read own STL files" on storage.objects;
create policy "Authenticated users can read own STL files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'stl-files' and owner = auth.uid());
