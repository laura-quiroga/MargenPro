-- Panel de administración (backoffice) — tablas nuevas + acceso admin (plan aprobado).
-- Mismo patrón de RLS que supabase/schema.sql: (select auth.uid()) = user_id.
-- private.is_admin() evita la recursión de RLS al chequear el rol admin dentro de su propia tabla,
-- y se reusa para dar lectura total a admin en event_log/error_log/ai_calls.

-- ── profiles — una fila por usuario, con su rol y estado de acceso ──────────
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  name          text,
  role          text not null default 'user' check (role in ('user', 'admin')),
  source        text, -- canal de adquisición (ads/organico/afiliado/...), null si no se conoce
  access_status text not null default 'active' check (access_status in ('active', 'disabled')),
  created_at    timestamptz not null default now()
);
create index profiles_role_idx on public.profiles(role);

create or replace function private.is_admin() returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

alter table public.profiles enable row level security;
create policy "select_own" on public.profiles for select using ((select auth.uid()) = id);
create policy "update_own" on public.profiles for update
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "admin_lee_todo" on public.profiles for select using (private.is_admin());

-- Crea la fila de profiles automáticamente cuando alguien se registra (patrón estándar Supabase).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: usuarios que ya existían antes de esta migración.
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- ── event_log — subconjunto real de la taxonomía de 36-ANALITICA-Y-EVENTOS.md,
-- recortado a las acciones núcleo que ya existen en la app ──────────────────
create table public.event_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  evento     text not null check (evento in (
    'sesion_iniciada', 'receta_creada', 'cotizacion_creada', 'insumo_agregado', 'factura_escaneada'
  )),
  metadata   jsonb,
  created_at timestamptz not null default now()
);
create index event_log_user_idx on public.event_log(user_id);
create index event_log_user_created_idx on public.event_log(user_id, created_at desc);
create index event_log_evento_idx on public.event_log(evento);

alter table public.event_log enable row level security;
create policy "select_own" on public.event_log for select using ((select auth.uid()) = user_id);
create policy "insert_own" on public.event_log for insert with check ((select auth.uid()) = user_id);
create policy "admin_lee_todo" on public.event_log for select using (private.is_admin());

-- ── error_log — errores de runtime (Error Boundary global + reportes puntuales) ─
create table public.error_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete set null, -- null si es anónimo
  mensaje    text not null,
  stack      text,
  pantalla   text,
  created_at timestamptz not null default now()
);
create index error_log_created_idx on public.error_log(created_at desc);

alter table public.error_log enable row level security;
create policy "insert_own_or_anonimo" on public.error_log for insert
  with check (user_id is null or (select auth.uid()) = user_id);
create policy "admin_lee_todo" on public.error_log for select using (private.is_admin());

-- ── acquisition_spend — gasto de adquisición por canal/mes (alta manual del dueño) ─
create table public.acquisition_spend (
  id         uuid primary key default gen_random_uuid(),
  canal      text not null check (length(canal) between 1 and 60),
  monto_usd  numeric not null check (monto_usd >= 0),
  mes        date not null, -- día 1 del mes que representa
  created_at timestamptz not null default now()
);
create index acquisition_spend_mes_idx on public.acquisition_spend(mes);

alter table public.acquisition_spend enable row level security;
create policy "admin_lee_todo" on public.acquisition_spend for select using (private.is_admin());
create policy "admin_escribe" on public.acquisition_spend for insert with check (private.is_admin());

-- ── ai_calls — tabla ya existente (escaneo de factura): se AGREGA lectura admin ─
create policy "admin_lee_todo" on public.ai_calls for select using (private.is_admin());

-- ── RPC: resumen de usuarios con sus conteos, SOLO para admin ───────────────
-- No se amplía el RLS de insumos/recetas/cotizaciones (precios privados de cada usuario) —
-- esta función devuelve únicamente números agregados, nunca filas de esas tablas.
create or replace function public.admin_resumen_usuarios()
returns table (
  user_id uuid,
  email text,
  name text,
  access_status text,
  created_at timestamptz,
  insumos_count bigint,
  recetas_count bigint,
  cotizaciones_count bigint
)
language plpgsql security definer stable
set search_path = public
as $$
begin
  if not private.is_admin() then
    raise exception 'No autorizado';
  end if;
  return query
    select p.id, p.email, p.name, p.access_status, p.created_at,
      (select count(*) from public.insumos i where i.user_id = p.id),
      (select count(*) from public.recetas r where r.user_id = p.id),
      (select count(*) from public.cotizaciones c where c.user_id = p.id)
    from public.profiles p
    order by p.created_at desc;
end;
$$;
