-- Escaneo de factura por foto: tablas nuevas (Fase 1 del plan aprobado).
-- Mismo patrón de RLS que supabase/schema.sql: (select auth.uid()) = user_id.

create table public.facturas_escaneadas (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  estado       text not null default 'procesando' check (estado in ('procesando', 'revision', 'confirmada', 'descartada')),
  modo         text not null default 'manual' check (modo in ('manual', 'automatico')),
  items        jsonb not null default '[]'::jsonb, -- ítems detectados: {texto_original, producto, cantidad, medida, precio, confianza, insumo_id}
  imagen_path  text, -- ruta en el bucket temporal; se pone en null al confirmar/descartar o a las 48h
  error        text, -- mensaje de error legible si la extracción falló
  deshecho_en  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index facturas_escaneadas_user_idx on public.facturas_escaneadas(user_id);

create trigger facturas_escaneadas_set_updated_at before update on public.facturas_escaneadas
  for each row execute function private.set_updated_at();

alter table public.facturas_escaneadas enable row level security;
create policy "select_own" on public.facturas_escaneadas for select
  using ((select auth.uid()) = user_id);
create policy "insert_own" on public.facturas_escaneadas for insert
  with check ((select auth.uid()) = user_id);
create policy "update_own" on public.facturas_escaneadas for update
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete_own" on public.facturas_escaneadas for delete
  using ((select auth.uid()) = user_id);


create table public.insumo_alias (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  insumo_id     uuid not null references public.insumos(id) on delete cascade,
  texto_factura text not null check (length(texto_factura) between 1 and 160),
  created_at    timestamptz not null default now(),
  unique (user_id, texto_factura)
);
create index insumo_alias_user_idx on public.insumo_alias(user_id);
create index insumo_alias_insumo_idx on public.insumo_alias(insumo_id);

alter table public.insumo_alias enable row level security;
create policy "select_own" on public.insumo_alias for select
  using ((select auth.uid()) = user_id);
create policy "insert_own" on public.insumo_alias for insert
  with check ((select auth.uid()) = user_id);
create policy "delete_own" on public.insumo_alias for delete
  using ((select auth.uid()) = user_id);


create table public.insumo_precio_historial (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  insumo_id       uuid not null references public.insumos(id) on delete cascade,
  precio_anterior numeric not null,
  precio_nuevo    numeric not null,
  origen          text not null check (origen in ('manual', 'factura')),
  factura_id      uuid references public.facturas_escaneadas(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index insumo_precio_historial_user_idx on public.insumo_precio_historial(user_id);
create index insumo_precio_historial_insumo_idx on public.insumo_precio_historial(insumo_id);
create index insumo_precio_historial_factura_idx on public.insumo_precio_historial(factura_id);

alter table public.insumo_precio_historial enable row level security;
create policy "select_own" on public.insumo_precio_historial for select
  using ((select auth.uid()) = user_id);
create policy "insert_own" on public.insumo_precio_historial for insert
  with check ((select auth.uid()) = user_id);


-- Registro de CADA compra de insumo (manual o por factura) con fecha — a diferencia de
-- insumo_precio_historial (solo guarda el cambio de precio), esto es lo que permite calcular
-- "cuánto gastaste en insumos este mes" de verdad en Panorama, sin depender de un número fijo.
create table public.compras_insumo (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  insumo_id  uuid references public.insumos(id) on delete set null,
  cantidad   numeric not null check (cantidad > 0),
  total      numeric not null check (total >= 0),
  origen     text not null default 'manual' check (origen in ('manual', 'factura')),
  factura_id uuid references public.facturas_escaneadas(id) on delete set null,
  created_at timestamptz not null default now()
);
create index compras_insumo_user_created_idx on public.compras_insumo(user_id, created_at desc);

alter table public.compras_insumo enable row level security;
create policy "select_own" on public.compras_insumo for select
  using ((select auth.uid()) = user_id);
create policy "insert_own" on public.compras_insumo for insert
  with check ((select auth.uid()) = user_id);


create table public.ai_calls (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  tipo          text not null, -- ej: 'escaneo_factura'
  tokens_in     integer not null default 0,
  tokens_out    integer not null default 0,
  costo_usd     numeric not null default 0,
  factura_id    uuid references public.facturas_escaneadas(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index ai_calls_user_idx on public.ai_calls(user_id);
create index ai_calls_user_created_idx on public.ai_calls(user_id, created_at desc);

alter table public.ai_calls enable row level security;
create policy "select_own" on public.ai_calls for select
  using ((select auth.uid()) = user_id);
-- Solo el servidor (service_role, dentro de la Edge Function) inserta aquí — nunca el cliente.


-- Bucket PRIVADO para la foto de la factura mientras dura la revisión (nunca público, a
-- diferencia de logos-negocio). Carpeta por usuario: auth.uid()/nombre-archivo.
insert into storage.buckets (id, name, public)
values ('facturas-temporales', 'facturas-temporales', false)
on conflict (id) do nothing;

create policy "facturas_insert_own" on storage.objects for insert
  with check (bucket_id = 'facturas-temporales' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "facturas_select_own" on storage.objects for select
  using (bucket_id = 'facturas-temporales' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "facturas_delete_own" on storage.objects for delete
  using (bucket_id = 'facturas-temporales' and (select auth.uid())::text = (storage.foldername(name))[1]);
