-- MargenPro — esquema inicial (Sesión 6, fase de servicios externos).
-- Pégalo completo en Supabase: tu proyecto -> SQL Editor -> New query -> Run.
-- App B2C simple: cada fila pertenece a un solo usuario (user_id), sin organizaciones.
-- RLS activo en toda tabla, por comando (select/insert/update/delete), con (select auth.uid())
-- envuelto en subquery (forma rápida) e índice en cada user_id/FK — ver docs/sistema/25-BASE-DE-DATOS.md.

create schema if not exists private;

create or replace function private.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── config_negocio — una fila por usuario ───────────────────────────────────
create table public.config_negocio (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  fijo_pct       integer not null default 20 check (fijo_pct between 0 and 100),
  variable_pct   integer not null default 0 check (variable_pct between 0 and 100),
  valor_hora     numeric not null default 8000 check (valor_hora >= 0),
  modo_calculo   text not null default 'simple' check (modo_calculo in ('simple', 'real')),
  moneda         text not null default 'COP' check (moneda in ('COP', 'MXN', 'PEN', 'USD')),
  nombre_negocio text not null default 'MargenPro',
  linea_atencion text not null default '',
  logo_negocio_url text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger config_negocio_set_updated_at before update on public.config_negocio
  for each row execute function private.set_updated_at();

alter table public.config_negocio enable row level security;
create policy "select_own" on public.config_negocio for select using ((select auth.uid()) = user_id);
create policy "insert_own" on public.config_negocio for insert with check ((select auth.uid()) = user_id);
create policy "update_own" on public.config_negocio for update
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ── insumos ──────────────────────────────────────────────────────────────────
create table public.insumos (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  nombre             text not null check (length(nombre) between 1 and 120),
  unidad             text not null check (unidad in ('kg', 'g', 'L', 'ml', 'libra', 'unidad', 'docena', 'paquete')),
  precio             numeric not null check (precio >= 0),
  unidades_que_trae  numeric not null default 1 check (unidades_que_trae > 0),
  categoria          text not null check (categoria in ('ingrediente', 'empaque', 'adicional')),
  stock_disponible   numeric,
  ultima_compra_cantidad numeric,
  ultima_compra_total    numeric,
  ultima_compra_medida   text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index insumos_user_idx on public.insumos(user_id);

create trigger insumos_set_updated_at before update on public.insumos
  for each row execute function private.set_updated_at();

alter table public.insumos enable row level security;
create policy "select_own" on public.insumos for select using ((select auth.uid()) = user_id);
create policy "insert_own" on public.insumos for insert with check ((select auth.uid()) = user_id);
create policy "update_own" on public.insumos for update
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete_own" on public.insumos for delete using ((select auth.uid()) = user_id);

-- ── recetas ──────────────────────────────────────────────────────────────────
-- es_subreceta = true: es una subreceta/adicional (solo lleva su costo de insumos, sin margen,
-- nunca se cotiza sola). false (default): es una receta final, la que se costea y se cotiza.
create table public.recetas (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  nombre       text not null check (length(nombre) between 1 and 160),
  margen       integer not null default 50 check (margen between 0 and 95),
  horas        numeric not null default 0 check (horas >= 0),
  unidades     integer not null default 1 check (unidades >= 1),
  es_subreceta boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index recetas_user_idx on public.recetas(user_id);

create trigger recetas_set_updated_at before update on public.recetas
  for each row execute function private.set_updated_at();

alter table public.recetas enable row level security;
create policy "select_own" on public.recetas for select using ((select auth.uid()) = user_id);
create policy "insert_own" on public.recetas for insert with check ((select auth.uid()) = user_id);
create policy "update_own" on public.recetas for update
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete_own" on public.recetas for delete using ((select auth.uid()) = user_id);

-- ── receta_insumos — tabla intermedia N:M: qué usa cada receta FINAL, insumos y/o subrecetas ──
-- Cada fila es insumo_id O subreceta_id (nunca ambos, nunca ninguno) — una subreceta solo puede
-- llevar insumos (no otra subreceta adentro, para evitar referencias circulares).
create table public.receta_insumos (
  id            uuid primary key default gen_random_uuid(),
  receta_id     uuid not null references public.recetas(id) on delete cascade,
  insumo_id     uuid references public.insumos(id) on delete restrict,
  subreceta_id  uuid references public.recetas(id) on delete cascade,
  cantidad_base numeric not null check (cantidad_base > 0), -- gramos/ml/piezas del insumo, o tandas de la subreceta
  created_at    timestamptz not null default now(),
  constraint receta_insumos_uno_u_otro check (
    (insumo_id is not null and subreceta_id is null) or (insumo_id is null and subreceta_id is not null)
  )
);
create index receta_insumos_receta_idx on public.receta_insumos(receta_id);
create index receta_insumos_insumo_idx on public.receta_insumos(insumo_id);

-- No tiene user_id propio: su RLS filtra por el dueño de la receta (y, si es una fila de
-- subreceta, también por el dueño de esa subreceta — una subreceta es a su vez una fila de
-- `recetas` con es_subreceta=true).
alter table public.receta_insumos enable row level security;
create policy "select_own" on public.receta_insumos for select
  using (receta_id in (select id from public.recetas where user_id = (select auth.uid())));
create policy "insert_own" on public.receta_insumos for insert
  with check (
    receta_id in (select id from public.recetas where user_id = (select auth.uid()))
    and (
      (insumo_id is not null and insumo_id in (select id from public.insumos where user_id = (select auth.uid())))
      or
      (subreceta_id is not null and subreceta_id in (select id from public.recetas where user_id = (select auth.uid()) and es_subreceta = true))
    )
  );
create policy "update_own" on public.receta_insumos for update
  using (receta_id in (select id from public.recetas where user_id = (select auth.uid())))
  with check (
    receta_id in (select id from public.recetas where user_id = (select auth.uid()))
    and (
      (insumo_id is not null and insumo_id in (select id from public.insumos where user_id = (select auth.uid())))
      or
      (subreceta_id is not null and subreceta_id in (select id from public.recetas where user_id = (select auth.uid()) and es_subreceta = true))
    )
  );
create policy "delete_own" on public.receta_insumos for delete
  using (receta_id in (select id from public.recetas where user_id = (select auth.uid())));

-- ── cotizaciones ─────────────────────────────────────────────────────────────
create table public.cotizaciones (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  receta_id  uuid references public.recetas(id) on delete set null,
  cliente    text not null check (length(cliente) between 1 and 120),
  producto   text not null, -- se guarda el nombre tal cual, aunque la receta cambie o se borre después
  telefono   text,
  monto      numeric not null check (monto >= 0),
  estado     text not null default 'pendiente' check (estado in ('pendiente', 'vendida', 'rechazada')),
  unidades_cotizadas numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index cotizaciones_user_idx on public.cotizaciones(user_id);
create index cotizaciones_user_created_idx on public.cotizaciones(user_id, created_at desc);

create trigger cotizaciones_set_updated_at before update on public.cotizaciones
  for each row execute function private.set_updated_at();

alter table public.cotizaciones enable row level security;
create policy "select_own" on public.cotizaciones for select using ((select auth.uid()) = user_id);
create policy "insert_own" on public.cotizaciones for insert with check ((select auth.uid()) = user_id);
create policy "update_own" on public.cotizaciones for update
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete_own" on public.cotizaciones for delete using ((select auth.uid()) = user_id);

-- ── cotizacion_items — una cotización puede tener VARIOS productos (ej. hamburguesas + galletas
-- en un mismo pedido). cotizaciones.producto/monto/receta_id/unidades_cotizadas quedan como el
-- resumen (nombre combinado, total, y null cuando hay más de un producto) — el detalle real vive
-- acá. Las cotizaciones viejas (antes de esta tabla) no tienen filas aquí; el código las trata
-- como si tuvieran UN solo ítem armado con sus propios campos.
create table public.cotizacion_items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  cotizacion_id uuid not null references public.cotizaciones(id) on delete cascade,
  receta_id     uuid references public.recetas(id) on delete set null,
  producto      text not null,
  cantidad      numeric not null check (cantidad > 0),
  monto         numeric not null check (monto >= 0),
  created_at    timestamptz not null default now()
);
create index cotizacion_items_user_idx on public.cotizacion_items(user_id);
create index cotizacion_items_cotizacion_idx on public.cotizacion_items(cotizacion_id);

alter table public.cotizacion_items enable row level security;
create policy "select_own" on public.cotizacion_items for select using ((select auth.uid()) = user_id);
create policy "insert_own" on public.cotizacion_items for insert with check ((select auth.uid()) = user_id);

-- ── Storage: logo del negocio (bucket público — se comparte igual por WhatsApp) ──
insert into storage.buckets (id, name, public) values ('logos-negocio', 'logos-negocio', true)
  on conflict (id) do nothing;

create policy "logos_lectura_publica" on storage.objects for select
  using (bucket_id = 'logos-negocio');
create policy "logos_subida_propia" on storage.objects for insert
  with check (bucket_id = 'logos-negocio' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "logos_actualiza_propia" on storage.objects for update
  using (bucket_id = 'logos-negocio' and (select auth.uid())::text = (storage.foldername(name))[1])
  with check (bucket_id = 'logos-negocio' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "logos_borra_propia" on storage.objects for delete
  using (bucket_id = 'logos-negocio' and (select auth.uid())::text = (storage.foldername(name))[1]);
