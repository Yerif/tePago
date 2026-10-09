-- 03_rls_escritura.test.sql
begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

-- ── Fixture: dos grupos aislados. A y A2 están en el grupo 1 (A es dueña); B está solo en el grupo 2. ──
insert into auth.users (id, email, aud, role) values
  ('a0000000-0000-0000-0000-00000000000a', 'a@test.mx', 'authenticated', 'authenticated'),
  ('a0000000-0000-0000-0000-0000000000a2', 'a2@test.mx', 'authenticated', 'authenticated'),
  ('b0000000-0000-0000-0000-00000000000b', 'b@test.mx', 'authenticated', 'authenticated');
insert into public.profiles (id, display_name) values
  ('a0000000-0000-0000-0000-00000000000a', 'Ana'),
  ('a0000000-0000-0000-0000-0000000000a2', 'Ana dos'),
  ('b0000000-0000-0000-0000-00000000000b', 'Beto');
insert into public.groups (id, nombre, created_by) values
  ('11111111-1111-1111-1111-111111111111', 'Grupo 1', 'a0000000-0000-0000-0000-00000000000a'),
  ('22222222-2222-2222-2222-222222222222', 'Grupo 2', 'b0000000-0000-0000-0000-00000000000b');
insert into public.group_members (group_id, user_id, rol) values
  ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-00000000000a', 'owner'),
  ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-0000000000a2', 'member'),
  ('22222222-2222-2222-2222-222222222222', 'b0000000-0000-0000-0000-00000000000b', 'owner');
insert into public.expenses (id, group_id, descripcion, total, pagado_por, created_by) values
  ('e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Cena', 100.00, 'a0000000-0000-0000-0000-00000000000a', 'a0000000-0000-0000-0000-00000000000a'),
  ('e2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Tacos', 80.00, 'b0000000-0000-0000-0000-00000000000b', 'b0000000-0000-0000-0000-00000000000b');
insert into public.expense_shares (group_id, expense_id, user_id, monto) values
  ('11111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-00000000000a', 50.00),
  ('11111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-0000000000a2', 50.00),
  ('22222222-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222', 'b0000000-0000-0000-0000-00000000000b', 80.00);
insert into public.expense_items (id, group_id, expense_id, nombre, precio, cantidad) values
  ('1a111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'Chelas', 100.00, 1),
  ('2a222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222', 'Tacos', 80.00, 1);
insert into public.item_assignments (group_id, item_id, user_id, partes) values
  ('11111111-1111-1111-1111-111111111111', '1a111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-0000000000a2', 2),
  ('22222222-2222-2222-2222-222222222222', '2a222222-2222-2222-2222-222222222222', 'b0000000-0000-0000-0000-00000000000b', 1);
insert into public.settlements (id, group_id, de_user, a_user, monto, requeridos) values
  ('51111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-0000000000a2', 'a0000000-0000-0000-0000-00000000000a', 30.00, array['a0000000-0000-0000-0000-00000000000a']::uuid[]);
insert into public.user_badges (group_id, user_id, badge_slug) values
  ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-00000000000a', 'rayo'),
  ('22222222-2222-2222-2222-222222222222', 'b0000000-0000-0000-0000-00000000000b', 'generoso');
insert into public.user_skins (user_id, skin_slug) values
  ('a0000000-0000-0000-0000-00000000000a', 'clasico'), ('b0000000-0000-0000-0000-00000000000b', 'clasico');
insert into public.xp_events (user_id, group_id, cantidad, razon, ref_id) values
  ('a0000000-0000-0000-0000-00000000000a', '11111111-1111-1111-1111-111111111111', 10, 'gasto_registrado', 'e1111111-1111-1111-1111-111111111111'),
  ('b0000000-0000-0000-0000-00000000000b', '22222222-2222-2222-2222-222222222222', 10, 'gasto_registrado', 'e2222222-2222-2222-2222-222222222222');
insert into public.weekly_summaries (user_id, week_start, contenido) values
  ('a0000000-0000-0000-0000-00000000000a', '2026-10-05', '{}'), ('b0000000-0000-0000-0000-00000000000b', '2026-10-05', '{}');

-- Cambia de rol como lo hace Supabase: el JWT trae el `sub` y `auth.uid()` lo lee.
create or replace function pg_temp.como(uid uuid) returns void language plpgsql as $f$
begin
  perform set_config('request.jwt.claim.sub', uid::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end $f$;
create or replace function pg_temp.como_anon() returns void language plpgsql as $f$
begin
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '{}', true);
  execute 'set local role anon';
end $f$;
create or replace function pg_temp.filas(q text) returns bigint language plpgsql as $f$
declare n bigint;
begin
  execute q;
  get diagnostics n = row_count;
  return n;
end $f$;
grant execute on function pg_temp.filas(text) to public;
grant execute on function pg_temp.como(uuid), pg_temp.como_anon() to public;

select pg_temp.como('a0000000-0000-0000-0000-00000000000a');
select throws_ok($$insert into public.expenses (group_id, descripcion, total, pagado_por) values ('11111111-1111-1111-1111-111111111111', 'x', 10, 'a0000000-0000-0000-0000-00000000000a')$$, '42501', null, 'A no inserta gastos directo (solo por función)');
select throws_ok($$update public.expenses set total = 1$$, '42501', null, 'A no actualiza gastos directo');
select throws_ok($$delete from public.expenses$$, '42501', null, 'A no borra gastos directo');
select throws_ok($$insert into public.expense_shares (group_id, expense_id, user_id, monto) values ('11111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-00000000000a', 1)$$, '42501', null, 'A no inserta repartos directo');
select throws_ok($$update public.expense_shares set monto = 0$$, '42501', null, 'A no cambia repartos');
select throws_ok($$insert into public.expense_items (group_id, expense_id, nombre, precio) values ('11111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'x', 1)$$, '42501', null, 'A no inserta items directo');
select throws_ok($$insert into public.item_assignments (group_id, item_id, user_id, partes) values ('11111111-1111-1111-1111-111111111111', '1a111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-00000000000a', 1)$$, '42501', null, 'A no asigna items directo');
select throws_ok($$insert into public.settlements (group_id, de_user, a_user, monto) values ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-00000000000a', 'a0000000-0000-0000-0000-0000000000a2', 10)$$, '42501', null, 'A no crea pagos directo');
select throws_ok($$update public.settlements set estado = 'confirmado'$$, '42501', null, 'A no confirma pagos directo');
select throws_ok($$delete from public.settlements$$, '42501', null, 'A no borra pagos');
select throws_ok($$insert into public.group_members (group_id, user_id) values ('11111111-1111-1111-1111-111111111111', 'b0000000-0000-0000-0000-00000000000b')$$, '42501', null, 'A no mete a nadie a su grupo directo');
select throws_ok($$update public.group_members set rol = 'owner'$$, '42501', null, 'A no cambia roles directo');
select throws_ok($$delete from public.group_members$$, '42501', null, 'A no saca gente del grupo directo');
select throws_ok($$insert into public.groups (nombre) values ('x')$$, '42501', null, 'A no crea grupos directo (solo crear_grupo)');
select throws_ok($$delete from public.groups$$, '42501', null, 'A no borra grupos directo');
select throws_ok($$insert into public.xp_events (user_id, cantidad, razon, ref_id) values ('a0000000-0000-0000-0000-00000000000a', 999, 'gasto_registrado', 'trampa')$$, '42501', null, 'A no se regala XP');
select throws_ok($$update public.xp_events set cantidad = 999$$, '42501', null, 'A no cambia su XP registrada');
select throws_ok($$delete from public.xp_events$$, '42501', null, 'A no borra eventos de XP');
select throws_ok($$insert into public.user_badges (group_id, user_id, badge_slug) values ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-00000000000a', 'alcalde')$$, '42501', null, 'A no se regala badges');
select throws_ok($$update public.user_badges set revoked_at = null$$, '42501', null, 'A no edita badges');
select throws_ok($$insert into public.user_skins (user_id, skin_slug) values ('a0000000-0000-0000-0000-00000000000a', 'leyenda')$$, '42501', null, 'A no se regala skins');
select throws_ok($$insert into public.weekly_summaries (user_id, week_start, contenido) values ('a0000000-0000-0000-0000-00000000000a', '2026-10-12', '{}')$$, '42501', null, 'A no escribe resúmenes');
select throws_ok($$update public.profiles set xp = 99999$$, '42501', null, 'A no cambia su XP en el perfil (sin privilegio de columna)');
select throws_ok($$insert into public.profiles (id, display_name) values (gen_random_uuid(), 'x')$$, '42501', null, 'A no crea perfiles ajenos');
select throws_ok($$delete from public.profiles$$, '42501', null, 'A no borra perfiles directo');
select throws_ok($$update public.groups set invite_code = 'robado0000000000'$$, '42501', null, 'A no cambia el código de invitación directo (solo con función)');
select is(pg_temp.filas($$update public.profiles set display_name = 'Ana nueva' where id = 'a0000000-0000-0000-0000-00000000000a'$$), 1::bigint, 'A edita su nombre');
select is(pg_temp.filas($$update public.profiles set avatar_base = 'gato' where id = 'a0000000-0000-0000-0000-00000000000a'$$), 1::bigint, 'A cambia su personaje');
select is(pg_temp.filas($$update public.profiles set display_name = 'hackeada' where id = 'a0000000-0000-0000-0000-0000000000a2'$$), 0::bigint, 'A no edita el perfil de otra persona');
select is(pg_temp.filas($$update public.profiles set display_name = 'hackeado' where id = 'b0000000-0000-0000-0000-00000000000b'$$), 0::bigint, 'A no edita el perfil de B');
select is(pg_temp.filas($$update public.groups set nombre = 'Renombrado' where id = '11111111-1111-1111-1111-111111111111'$$), 1::bigint, 'A (dueña) renombra su grupo');
select is(pg_temp.filas($$update public.groups set invite_revoked_at = now() where id = '11111111-1111-1111-1111-111111111111'$$), 1::bigint, 'A (dueña) revoca el código');
select is(pg_temp.filas($$update public.groups set nombre = 'robado' where id = '22222222-2222-2222-2222-222222222222'$$), 0::bigint, 'A no renombra el grupo 2');
select throws_ok($$update public.profiles set avatar_base = 'dragon' where id = 'a0000000-0000-0000-0000-00000000000a'$$, '23514', null, 'el personaje debe ser uno del catálogo');
reset role;
select pg_temp.como('a0000000-0000-0000-0000-0000000000a2');
select is(pg_temp.filas($$update public.groups set nombre = 'golpe' where id = '11111111-1111-1111-1111-111111111111'$$), 0::bigint, 'A2 (miembro, no dueña) no renombra el grupo');
reset role;
select pg_temp.como_anon();
select throws_ok($$insert into public.profiles (id, display_name) values (gen_random_uuid(), 'x')$$, '42501', null, 'anon no crea perfiles');
select throws_ok($$update public.groups set nombre = 'x'$$, '42501', null, 'anon no edita grupos');
reset role;

select * from finish();
rollback;
