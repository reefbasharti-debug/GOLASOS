create type public.app_role as enum ('admin','user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  kind text not null default 'club',
  description text,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.categories to anon;
grant select, insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "public read active categories" on public.categories for select to anon using (is_active);
create policy "auth read categories" on public.categories for select to authenticated using (true);
create policy "admins manage categories" on public.categories for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger categories_updated_at before update on public.categories for each row execute function public.update_updated_at_column();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  supplier_model text,
  description text,
  image_url text,
  extra_images text[] not null default '{}',
  sizes text[] not null default array['S','M','L','XL','2XL'],
  price_ils numeric(10,2) not null default 65,
  product_type text not null default 'jersey',
  is_active boolean not null default true,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products (category_id);
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "public read active products" on public.products for select to anon using (is_active);
create policy "auth read products" on public.products for select to authenticated using (true);
create policy "admins manage products" on public.products for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger products_updated_at before update on public.products for each row execute function public.update_updated_at_column();

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigserial,
  customer_name text not null,
  phone text not null,
  email text,
  city text,
  address text,
  notes text,
  total_ils numeric(10,2) not null default 0,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update, delete on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "admins manage orders" on public.orders for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger orders_updated_at before update on public.orders for each row execute function public.update_updated_at_column();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  size text,
  quantity integer not null default 1,
  unit_price_ils numeric(10,2) not null default 0
);
create index order_items_order_idx on public.order_items (order_id);
grant select, update, delete on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "admins manage order items" on public.order_items for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.site_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;
create policy "admins manage settings" on public.site_settings for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger site_settings_updated_at before update on public.site_settings for each row execute function public.update_updated_at_column();

insert into public.site_settings (key, value) values
  ('telegram_chat_id',''),
  ('notify_email','reefbasharti@gmail.com'),
  ('site_title','גולאסוס'),
  ('hero_title','גולאסוס - חולצות ונעלי כדורגל'),
  ('hero_subtitle','חולצות מכל הקבוצות והנבחרות ב-65 ₪, נעלי כדורגל ב-350 ₪. משלוח לכל הארץ.'),
  ('jersey_price','65'),
  ('shoe_price','350'),
  ('whatsapp',''),
  ('shipping_note','ההזמנה תאושר טלפונית לפני המשלוח.');