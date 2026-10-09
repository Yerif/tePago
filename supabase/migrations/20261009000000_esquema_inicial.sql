-- Cuentas Conmigo — esquema inicial (CLAUDE.md §4 y §6).
-- Multitenant: `group_id` es la llave del tenant. RLS activa en TODAS las tablas desde esta migración.
-- Escrituras: `authenticated` solo lee (y actualiza columnas concretas de profiles y groups); todo lo demás se escribe con
-- funciones `security definer` (siguiente migración). Nunca se edita una migración aplicada: los cambios van en una nueva.

-- Los helpers de RLS se declaran antes de las tablas que consultan.
set check_function_bodies = off;

-- ───────────────────────── Helpers para las políticas ─────────────────────────

create or replace function public.is_group_member(gid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.group_members m
    where m.group_id = gid and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_group_owner(gid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.group_members m
    where m.group_id = gid and m.user_id = (select auth.uid()) and m.rol = 'owner'
  );
$$;

-- ¿Comparto algún grupo con esa persona? (para ver su perfil: nombre, personaje, nivel)
create or replace function public.comparte_grupo_con(otro uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members a
    join public.group_members b on b.group_id = a.group_id
    where a.user_id = (select auth.uid()) and b.user_id = otro
  );
$$;

-- ───────────────────────── Globales (por usuario) ─────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique check (username is null or username ~ '^[a-z0-9_]{3,24}$'),
  display_name text not null check (char_length(display_name) between 1 and 24),
  avatar_base text not null default 'persona-sol'
    check (avatar_base in ('persona-sol', 'persona-luna', 'persona-nube', 'oso', 'zorro', 'conejo', 'rana', 'gato', 'buho')),
  skin_activo text not null default 'clasico'
    check (skin_activo in ('clasico', 'jardinero', 'alcalde', 'explorador', 'leyenda')),
  xp integer not null default 0 check (xp >= 0), -- el nivel se deriva de xp (progresoNivel)
  created_at timestamptz not null default now()
);

create table public.user_skins (
  user_id uuid not null references auth.users (id) on delete cascade,
  skin_slug text not null check (skin_slug in ('clasico', 'jardinero', 'alcalde', 'explorador', 'leyenda')),
  unlocked_at timestamptz not null default now(),
  primary key (user_id, skin_slug)
);

-- ───────────────────────── Tenant: grupos y membresías ─────────────────────────

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(nombre) between 1 and 40),
  icono text not null default '👥' check (char_length(icono) between 1 and 8),
  -- 16 caracteres hex (64 bits), revocable; se valida solo con `unirse_a_grupo` (con rate limit por IP).
  invite_code text not null unique default left(replace(gen_random_uuid()::text, '-', ''), 16) check (char_length(invite_code) >= 12),
  invite_revoked_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rol text not null default 'member' check (rol in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- ───────────────────────── Tenant: gastos ─────────────────────────

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  descripcion text not null check (char_length(descripcion) between 1 and 80),
  total numeric(12, 2) not null check (total > 0),
  moneda text not null default 'MXN' check (moneda = 'MXN'),
  pagado_por uuid not null,
  categoria text not null default 'otros'
    check (categoria in ('comida', 'super', 'fiesta', 'transporte', 'hospedaje', 'entretenimiento', 'hogar', 'regalos', 'otros')),
  split_mode text not null default 'igual'
    check (split_mode in ('igual', 'montos', 'porcentajes', 'partes', 'ajustes', 'itemizado')),
  sin_asignar numeric(12, 2) not null default 0 check (sin_asignar >= 0),
  sin_asignar_resolucion text check (sin_asignar_resolucion in ('absorbido', 'mio')),
  receipt_path text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (id, group_id),
  -- Quien pagó es del grupo; si borra su cuenta, se van sus gastos y las deudas ligadas (D7).
  foreign key (group_id, pagado_por) references public.group_members (group_id, user_id) on delete cascade,
  check (sin_asignar <= total),
  check (sin_asignar_resolucion is null or sin_asignar > 0)
);

create table public.expense_items (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null,
  expense_id uuid not null,
  nombre text not null check (char_length(nombre) between 1 and 80),
  precio numeric(12, 2) not null check (precio >= 0),
  cantidad integer not null default 1 check (cantidad >= 1),
  created_at timestamptz not null default now(),
  unique (id, group_id),
  -- Integridad entre tenants: un item no puede apuntar a un gasto de otro grupo.
  foreign key (expense_id, group_id) references public.expenses (id, group_id) on delete cascade
);

create table public.item_assignments (
  group_id uuid not null,
  item_id uuid not null,
  user_id uuid not null,
  partes integer not null check (partes >= 1), -- fracción = partes / Σ partes (enteros, nunca decimales)
  created_at timestamptz not null default now(),
  primary key (item_id, user_id),
  foreign key (item_id, group_id) references public.expense_items (id, group_id) on delete cascade,
  foreign key (group_id, user_id) references public.group_members (group_id, user_id) on delete cascade
);

create table public.expense_shares (
  group_id uuid not null,
  expense_id uuid not null,
  user_id uuid not null,
  monto numeric(12, 2) not null check (monto >= 0), -- lo que esa persona debe del gasto
  parametro integer, -- lo que se capturó (puntos base, partes o ajuste en centavos), para poder re-editar
  created_at timestamptz not null default now(),
  primary key (expense_id, user_id),
  foreign key (expense_id, group_id) references public.expenses (id, group_id) on delete cascade,
  foreign key (group_id, user_id) references public.group_members (group_id, user_id) on delete cascade
);

-- Invariante de dinero: Σ monto + sin_asignar = total. Se revisa al CIERRE de la transacción (diferido), así que las
-- funciones de escritura pueden insertar el gasto y sus repartos en cualquier orden dentro de la misma transacción.
-- Solo al insertar o actualizar: borrar una cuenta (D7) se lleva los repartos de esa persona en cascada y no debe fallar.
create or replace function public.verificar_total_gasto()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  eid uuid;
  esperado numeric(12, 2);
  suma numeric(12, 2);
begin
  if tg_table_name = 'expenses' then
    eid := new.id;
  else
    eid := new.expense_id;
  end if;
  select e.total - e.sin_asignar into esperado from public.expenses e where e.id = eid;
  if not found then
    return null; -- el gasto ya no existe
  end if;
  select coalesce(sum(s.monto), 0) into suma from public.expense_shares s where s.expense_id = eid;
  if suma <> esperado then
    raise exception 'Los repartos del gasto % suman % y deberían sumar % (total − sin asignar)', eid, suma, esperado
      using errcode = '23514';
  end if;
  return null;
end;
$$;

create constraint trigger gasto_suma_total_expenses
  after insert or update of total, sin_asignar on public.expenses
  deferrable initially deferred
  for each row execute function public.verificar_total_gasto();

create constraint trigger gasto_suma_total_shares
  after insert or update of monto on public.expense_shares
  deferrable initially deferred
  for each row execute function public.verificar_total_gasto();

-- ───────────────────────── Tenant: pagos (única fuente de verdad de lo saldado: solo los confirmados) ─────────────────────────

create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  lote_id uuid not null default gen_random_uuid(), -- agrupa los pagos de un mismo gesto que abarcó varios grupos
  de_user uuid not null,
  a_user uuid not null,
  monto numeric(12, 2) not null check (monto > 0),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'confirmado', 'rechazado', 'cancelado')),
  pares jsonb not null default '[]'::jsonb, -- pagos por pares en que se descompone (ver `rutaDePago`)
  requeridos uuid[] not null default '{}', -- quiénes deben confirmar
  respuestas jsonb not null default '{}'::jsonb, -- qué respondió cada quien
  resuelto_at timestamptz,
  created_at timestamptz not null default now(),
  check (de_user <> a_user),
  foreign key (group_id, de_user) references public.group_members (group_id, user_id) on delete cascade,
  foreign key (group_id, a_user) references public.group_members (group_id, user_id) on delete cascade
);

-- ───────────────────────── Juego: lo ganado (solo se escribe con funciones security definer) ─────────────────────────

create table public.user_badges (
  group_id uuid not null,
  user_id uuid not null,
  badge_slug text not null check (badge_slug in ('rayo', 'generoso', 'fantasma', 'jardinero', 'alcalde', 'mecenas')),
  earned_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (group_id, user_id, badge_slug),
  foreign key (group_id, user_id) references public.group_members (group_id, user_id) on delete cascade
);

create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  group_id uuid references public.groups (id) on delete cascade,
  cantidad integer not null check (cantidad > 0),
  razon text not null check (razon in ('gasto_registrado', 'deuda_saldada', 'semana_sin_deudas')),
  ref_id text not null, -- id del gasto, del pago o de la semana: el mismo evento nunca da XP dos veces
  created_at timestamptz not null default now(),
  unique (user_id, razon, ref_id)
);

create table public.weekly_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null,
  contenido jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

-- ───────────────────────── Índices (CLAUDE.md §4) ─────────────────────────

create index group_members_user_id_idx on public.group_members (user_id); -- listar mis grupos
create index group_members_group_joined_idx on public.group_members (group_id, joined_at desc);
create index groups_created_by_idx on public.groups (created_by);
create index expenses_group_created_idx on public.expenses (group_id, created_at desc);
create index expense_items_group_created_idx on public.expense_items (group_id, created_at desc);
create index expense_items_expense_idx on public.expense_items (expense_id, group_id);
create index item_assignments_group_created_idx on public.item_assignments (group_id, created_at desc);
create index item_assignments_member_idx on public.item_assignments (group_id, user_id);
create index expense_shares_group_created_idx on public.expense_shares (group_id, created_at desc);
create index expense_shares_member_idx on public.expense_shares (group_id, user_id);
create index settlements_group_created_idx on public.settlements (group_id, created_at desc);
create index settlements_lote_idx on public.settlements (lote_id);
create index settlements_pagador_idx on public.settlements (group_id, de_user);
create index user_badges_group_earned_idx on public.user_badges (group_id, earned_at desc);
create index xp_events_user_created_idx on public.xp_events (user_id, created_at desc);
create index xp_events_group_created_idx on public.xp_events (group_id, created_at desc) where group_id is not null;
create index weekly_summaries_user_idx on public.weekly_summaries (user_id, week_start desc);

-- ───────────────────────── RLS: activa en todas, una política por operación ─────────────────────────

alter table public.profiles enable row level security;
alter table public.user_skins enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_items enable row level security;
alter table public.item_assignments enable row level security;
alter table public.expense_shares enable row level security;
alter table public.settlements enable row level security;
alter table public.user_badges enable row level security;
alter table public.xp_events enable row level security;
alter table public.weekly_summaries enable row level security;

-- Privilegios mínimos: nadie anónimo toca nada; `authenticated` solo lee, salvo las columnas que se listan abajo.
revoke all on public.profiles, public.user_skins, public.groups, public.group_members, public.expenses, public.expense_items,
  public.item_assignments, public.expense_shares, public.settlements, public.user_badges, public.xp_events, public.weekly_summaries
  from anon, authenticated;
grant select on public.profiles, public.user_skins, public.groups, public.group_members, public.expenses, public.expense_items,
  public.item_assignments, public.expense_shares, public.settlements, public.user_badges, public.xp_events, public.weekly_summaries
  to authenticated;
-- Perfil: la persona edita su nombre, usuario y personaje; NUNCA su XP (columna sin privilegio de update).
grant update (username, display_name, avatar_base, skin_activo) on public.profiles to authenticated;
-- Grupo: el dueño cambia nombre e ícono y revoca el código; el código se genera/rota con funciones.
grant update (nombre, icono, invite_revoked_at) on public.groups to authenticated;
-- Los helpers los llaman las políticas con el rol del usuario.
revoke execute on function public.is_group_member(uuid), public.is_group_owner(uuid), public.comparte_grupo_con(uuid) from public, anon;
grant execute on function public.is_group_member(uuid), public.is_group_owner(uuid), public.comparte_grupo_con(uuid) to authenticated;

-- profiles: mi perfil y el de quien comparte grupo conmigo; solo yo lo edito.
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.comparte_grupo_con(id));
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- user_skins y weekly_summaries y xp_events: solo las propias.
create policy user_skins_select on public.user_skins for select to authenticated using (user_id = (select auth.uid()));
create policy weekly_summaries_select on public.weekly_summaries for select to authenticated using (user_id = (select auth.uid()));
create policy xp_events_select on public.xp_events for select to authenticated using (user_id = (select auth.uid()));

-- groups
create policy groups_select on public.groups for select to authenticated using (public.is_group_member(id));
create policy groups_update on public.groups for update to authenticated
  using (public.is_group_owner(id)) with check (public.is_group_owner(id));

-- group_members: veo a quienes están en mis grupos.
create policy group_members_select on public.group_members for select to authenticated using (public.is_group_member(group_id));

-- Tablas de tenant: lectura para miembros del grupo (escritura solo por funciones).
create policy expenses_select on public.expenses for select to authenticated using (public.is_group_member(group_id));
create policy expense_items_select on public.expense_items for select to authenticated using (public.is_group_member(group_id));
create policy item_assignments_select on public.item_assignments for select to authenticated using (public.is_group_member(group_id));
create policy expense_shares_select on public.expense_shares for select to authenticated using (public.is_group_member(group_id));
create policy settlements_select on public.settlements for select to authenticated using (public.is_group_member(group_id));
create policy user_badges_select on public.user_badges for select to authenticated using (public.is_group_member(group_id));
