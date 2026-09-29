## Ticket

<!-- Link al ticket de Notion · Épica · Loop -->

## Qué cambia

-

## Cómo se probó

- [ ] `npm run lint && npm run test && npm run build` en verde
- [ ] Si toca la DB: migración nueva + `npm run db:types` + `npx supabase test db` en verde
- [ ] Revisado en dark y light, móvil (375 px) y desktop

## Seguridad y costo

- [ ] Sin secretos ni `NEXT_PUBLIC_` para claves
- [ ] Tablas nuevas con RLS y test A/B · API routes con `withGuard`
- [ ] Threat model (A13) registrado si toca auth, dinero, IA, storage o invite codes
- [ ] Dependencias nuevas justificadas aquí y sin costo

## ¿CLAUDE.md o docs cambian?

<!-- Sí/No y qué -->
