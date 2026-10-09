-- 01_esquema.test.sql
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
grant execute on function pg_temp.como(uuid), pg_temp.como_anon() to public;

select is((select count(*) from pg_tables where schemaname = 'public' and not rowsecurity), 0::bigint, 'ninguna tabla de public queda sin RLS');
select is((select count(*) from pg_tables where schemaname = 'public'), 12::bigint, 'son las 12 tablas del esquema (CLAUDE.md §6)');
select throws_ok($$insert into public.expense_items (group_id, expense_id, nombre, precio) values ('22222222-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111', 'x', 1)$$, '23503', null, 'un item no puede apuntar a un gasto de otro grupo');
select throws_ok($$insert into public.expense_shares (group_id, expense_id, user_id, monto) values ('22222222-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111', 'b0000000-0000-0000-0000-00000000000b', 1)$$, '23503', null, 'un reparto no puede apuntar a un gasto de otro grupo');
select throws_ok($$insert into public.expenses (group_id, descripcion, total, pagado_por) values ('11111111-1111-1111-1111-111111111111', 'x', 10, 'b0000000-0000-0000-0000-00000000000b')$$, '23503', null, 'quien paga debe ser del grupo');
select throws_ok($$insert into public.expense_shares (group_id, expense_id, user_id, monto) values ('11111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'b0000000-0000-0000-0000-00000000000b', 0)$$, '23503', null, 'no se reparte a alguien que no es del grupo');
select throws_ok($$insert into public.item_assignments (group_id, item_id, user_id, partes) values ('11111111-1111-1111-1111-111111111111', '1a111111-1111-1111-1111-111111111111', 'b0000000-0000-0000-0000-00000000000b', 1)$$, '23503', null, 'no se asigna un item a alguien de otro grupo');
select throws_ok($$insert into public.settlements (group_id, de_user, a_user, monto) values ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-00000000000a', 'b0000000-0000-0000-0000-00000000000b', 10)$$, '23503', null, 'no se paga a alguien de otro grupo');
select throws_ok($$insert into public.user_badges (group_id, user_id, badge_slug) values ('11111111-1111-1111-1111-111111111111', 'b0000000-0000-0000-0000-00000000000b', 'rayo')$$, '23503', null, 'no se da un badge a alguien de otro grupo');
select throws_ok($$insert into public.expenses (group_id, descripcion, total, pagado_por) values ('11111111-1111-1111-1111-111111111111', 'x', 0, 'a0000000-0000-0000-0000-00000000000a')$$, '23514', null, 'el total debe ser > 0');
select throws_ok($$insert into public.expense_items (group_id, expense_id, nombre, precio) values ('11111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'x', -1)$$, '23514', null, 'un precio no es negativo');
select throws_ok($$insert into public.item_assignments (group_id, item_id, user_id, partes) values ('11111111-1111-1111-1111-111111111111', '1a111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-00000000000a', 0)$$, '23514', null, 'las partes son enteros >= 1');
select throws_ok($$insert into public.settlements (group_id, de_user, a_user, monto) values ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-00000000000a', 'a0000000-0000-0000-0000-0000000000a2', 0)$$, '23514', null, 'un pago debe ser > 0');
select throws_ok($$insert into public.settlements (group_id, de_user, a_user, monto) values ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-00000000000a', 'a0000000-0000-0000-0000-00000000000a', 10)$$, '23514', null, 'nadie se paga a sí mismo');
select throws_ok($$insert into public.expenses (group_id, descripcion, total, pagado_por, sin_asignar) values ('11111111-1111-1111-1111-111111111111', 'x', 10, 'a0000000-0000-0000-0000-00000000000a', 11)$$, '23514', null, 'lo sin asignar no puede pasar del total');
select throws_ok($$insert into public.expenses (group_id, descripcion, total, pagado_por, sin_asignar_resolucion) values ('11111111-1111-1111-1111-111111111111', 'x', 10, 'a0000000-0000-0000-0000-00000000000a', 'mio')$$, '23514', null, 'no hay resolución si no hay nada sin asignar');
select throws_ok($$insert into public.xp_events (user_id, cantidad, razon, ref_id) values ('a0000000-0000-0000-0000-00000000000a', 10, 'gasto_registrado', 'e1111111-1111-1111-1111-111111111111')$$, '23505', null, 'el mismo evento nunca da XP dos veces');
select throws_ok($$insert into public.weekly_summaries (user_id, week_start, contenido) values ('a0000000-0000-0000-0000-00000000000a', '2026-10-05', '{}')$$, '23505', null, 'un solo resumen por semana');

savepoint mal;
insert into public.expenses (id, group_id, descripcion, total, pagado_por) values ('e3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Mal repartido', 100.00, 'a0000000-0000-0000-0000-00000000000a');
insert into public.expense_shares (group_id, expense_id, user_id, monto) values ('11111111-1111-1111-1111-111111111111', 'e3333333-3333-3333-3333-333333333333', 'a0000000-0000-0000-0000-00000000000a', 40.00);
select throws_ok('set constraints gasto_suma_total_expenses, gasto_suma_total_shares immediate', '23514', null, 'repartos que no suman el total se rechazan al cierre');
rollback to savepoint mal;

savepoint bien;
insert into public.expenses (id, group_id, descripcion, total, pagado_por, sin_asignar) values ('e4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Con sin asignar', 100.00, 'a0000000-0000-0000-0000-00000000000a', 20.00);
insert into public.expense_shares (group_id, expense_id, user_id, monto) values ('11111111-1111-1111-1111-111111111111', 'e4444444-4444-4444-4444-444444444444', 'a0000000-0000-0000-0000-00000000000a', 30.00), ('11111111-1111-1111-1111-111111111111', 'e4444444-4444-4444-4444-444444444444', 'a0000000-0000-0000-0000-0000000000a2', 50.00);
select lives_ok('set constraints gasto_suma_total_expenses, gasto_suma_total_shares immediate', 'Σ repartos + sin asignar = total pasa');
rollback to savepoint bien;

select cmp_ok((select char_length(invite_code) from public.groups where id = '11111111-1111-1111-1111-111111111111'), '>=', 12, 'el código de invitación tiene al menos 12 caracteres');
select isnt((select invite_code from public.groups where id = '11111111-1111-1111-1111-111111111111'), (select invite_code from public.groups where id = '22222222-2222-2222-2222-222222222222'), 'cada grupo, su código');

-- Borrar cuenta = borrar datos (D7): se van sus repartos, sus pagos y los gastos que pagó; el resto se queda.
delete from auth.users where id = 'a0000000-0000-0000-0000-0000000000a2';
select is((select count(*) from public.profiles where id = 'a0000000-0000-0000-0000-0000000000a2'), 0::bigint, 'se va el perfil');
select is((select count(*) from public.group_members where user_id = 'a0000000-0000-0000-0000-0000000000a2'), 0::bigint, 'se va su membresía');
select is((select count(*) from public.settlements where de_user = 'a0000000-0000-0000-0000-0000000000a2' or a_user = 'a0000000-0000-0000-0000-0000000000a2'), 0::bigint, 'se van los pagos donde participaba');
select is((select count(*) from public.expense_shares where user_id = 'a0000000-0000-0000-0000-0000000000a2'), 0::bigint, 'se van sus repartos (sus deudas)');
select is((select count(*) from public.expenses where id = 'e1111111-1111-1111-1111-111111111111'), 1::bigint, 'el gasto sigue ahí (lo pagó otra persona)');
delete from auth.users where id = 'a0000000-0000-0000-0000-00000000000a';
select is((select count(*) from public.expenses where pagado_por = 'a0000000-0000-0000-0000-00000000000a'), 0::bigint, 'se van los gastos que pagó la persona borrada');
select is((select count(*) from public.groups where id = '11111111-1111-1111-1111-111111111111'), 1::bigint, 'el grupo no se borra con la cuenta de su creadora');
select is((select count(*) from public.expenses where group_id = '22222222-2222-2222-2222-222222222222'), 1::bigint, 'el otro grupo ni se entera');

select * from finish();
rollback;
