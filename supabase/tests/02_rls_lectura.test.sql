-- 02_rls_lectura.test.sql
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

select pg_temp.como('a0000000-0000-0000-0000-00000000000a');
select is((select count(*) from public.groups), 1::bigint, 'A ve en groups solo lo de su grupo');
select is((select count(*) from public.groups where id = '22222222-2222-2222-2222-222222222222'), 0::bigint, 'A no ve nada de groups del grupo 2');
select is((select count(*) from public.group_members), 2::bigint, 'A ve en group_members solo lo de su grupo');
select is((select count(*) from public.group_members where group_id = '22222222-2222-2222-2222-222222222222'), 0::bigint, 'A no ve nada de group_members del grupo 2');
select is((select count(*) from public.expenses), 1::bigint, 'A ve en expenses solo lo de su grupo');
select is((select count(*) from public.expenses where group_id = '22222222-2222-2222-2222-222222222222'), 0::bigint, 'A no ve nada de expenses del grupo 2');
select is((select count(*) from public.expense_items), 1::bigint, 'A ve en expense_items solo lo de su grupo');
select is((select count(*) from public.expense_items where group_id = '22222222-2222-2222-2222-222222222222'), 0::bigint, 'A no ve nada de expense_items del grupo 2');
select is((select count(*) from public.item_assignments), 1::bigint, 'A ve en item_assignments solo lo de su grupo');
select is((select count(*) from public.item_assignments where group_id = '22222222-2222-2222-2222-222222222222'), 0::bigint, 'A no ve nada de item_assignments del grupo 2');
select is((select count(*) from public.expense_shares), 2::bigint, 'A ve en expense_shares solo lo de su grupo');
select is((select count(*) from public.expense_shares where group_id = '22222222-2222-2222-2222-222222222222'), 0::bigint, 'A no ve nada de expense_shares del grupo 2');
select is((select count(*) from public.settlements), 1::bigint, 'A ve en settlements solo lo de su grupo');
select is((select count(*) from public.settlements where group_id = '22222222-2222-2222-2222-222222222222'), 0::bigint, 'A no ve nada de settlements del grupo 2');
select is((select count(*) from public.user_badges), 1::bigint, 'A ve en user_badges solo lo de su grupo');
select is((select count(*) from public.user_badges where group_id = '22222222-2222-2222-2222-222222222222'), 0::bigint, 'A no ve nada de user_badges del grupo 2');
select is((select count(*) from public.profiles), 2::bigint, 'A ve su perfil y el de quien comparte grupo');
select is((select count(*) from public.profiles where id = 'b0000000-0000-0000-0000-00000000000b'), 0::bigint, 'A no ve el perfil de B');
select is((select count(*) from public.user_skins), 1::bigint, 'A ve solo sus skins');
select is((select count(*) from public.xp_events), 1::bigint, 'A ve solo su XP');
select is((select count(*) from public.weekly_summaries), 1::bigint, 'A ve solo sus resúmenes');
select is((select count(*) from public.expenses where id = 'e2222222-2222-2222-2222-222222222222'), 0::bigint, 'A no lee el gasto de B por id');
reset role;
select pg_temp.como('b0000000-0000-0000-0000-00000000000b');
select is((select count(*) from public.groups), 1::bigint, 'B ve en groups solo lo de su grupo');
select is((select count(*) from public.group_members), 1::bigint, 'B ve en group_members solo lo de su grupo');
select is((select count(*) from public.expenses), 1::bigint, 'B ve en expenses solo lo de su grupo');
select is((select count(*) from public.expense_items), 1::bigint, 'B ve en expense_items solo lo de su grupo');
select is((select count(*) from public.item_assignments), 1::bigint, 'B ve en item_assignments solo lo de su grupo');
select is((select count(*) from public.expense_shares), 1::bigint, 'B ve en expense_shares solo lo de su grupo');
select is((select count(*) from public.settlements), 0::bigint, 'B ve en settlements solo lo de su grupo');
select is((select count(*) from public.user_badges), 1::bigint, 'B ve en user_badges solo lo de su grupo');
select is((select count(*) from public.profiles), 1::bigint, 'B solo ve su perfil');
select is((select count(*) from public.expenses where group_id = '11111111-1111-1111-1111-111111111111'), 0::bigint, 'B no ve gastos del grupo 1');
reset role;
select pg_temp.como('a0000000-0000-0000-0000-0000000000a2');
select is((select count(*) from public.expenses), 1::bigint, 'A2 (miembro) ve los gastos del grupo');
select is((select count(*) from public.profiles), 2::bigint, 'A2 ve a su compañera');
reset role;
select pg_temp.como_anon();
select throws_ok($$select * from public.profiles$$, '42501', null, 'anon no puede leer profiles');
reset role;
select pg_temp.como_anon();
select throws_ok($$select * from public.user_skins$$, '42501', null, 'anon no puede leer user_skins');
reset role;
select pg_temp.como_anon();
select throws_ok($$select * from public.groups$$, '42501', null, 'anon no puede leer groups');
reset role;
select pg_temp.como_anon();
select throws_ok($$select * from public.group_members$$, '42501', null, 'anon no puede leer group_members');
reset role;
select pg_temp.como_anon();
select throws_ok($$select * from public.expenses$$, '42501', null, 'anon no puede leer expenses');
reset role;
select pg_temp.como_anon();
select throws_ok($$select * from public.expense_items$$, '42501', null, 'anon no puede leer expense_items');
reset role;
select pg_temp.como_anon();
select throws_ok($$select * from public.item_assignments$$, '42501', null, 'anon no puede leer item_assignments');
reset role;
select pg_temp.como_anon();
select throws_ok($$select * from public.expense_shares$$, '42501', null, 'anon no puede leer expense_shares');
reset role;
select pg_temp.como_anon();
select throws_ok($$select * from public.settlements$$, '42501', null, 'anon no puede leer settlements');
reset role;
select pg_temp.como_anon();
select throws_ok($$select * from public.user_badges$$, '42501', null, 'anon no puede leer user_badges');
reset role;
select pg_temp.como_anon();
select throws_ok($$select * from public.xp_events$$, '42501', null, 'anon no puede leer xp_events');
reset role;
select pg_temp.como_anon();
select throws_ok($$select * from public.weekly_summaries$$, '42501', null, 'anon no puede leer weekly_summaries');
reset role;

select * from finish();
rollback;
