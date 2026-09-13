# Fase 12 — Preparación para producción

**Nada de esto se ha ejecutado todavía**, tal como pide la sección 50 del
spec: "NO conectar producción... hasta que todas las pruebas sean
aprobadas." Este documento es la checklist para cuando decidas dar ese paso.

## 1. Base de datos
- Aprovisionar PostgreSQL (Railway, Supabase, RDS, etc.).
- En `02_database/prisma/schema.prisma`: cambiar `provider = "sqlite"` →
  `provider = "postgresql"`.
- Reemplazar `db push` por migraciones versionadas: `npx prisma migrate dev
  --name init` (primera vez, en local, contra la nueva base) y `npx prisma
  migrate deploy` en cada despliegue.
- Migración de datos: si ya hay datos reales en SQLite, exportarlos con un
  script propio (no lo genera Prisma automáticamente) o empezar limpio en
  Postgres si aún es sandbox.

## 2. Variables de entorno reales
Nunca reutilizar los valores de `.env.example`. Como mínimo, regenerar:
- `JWT_SECRET` (valor aleatorio largo, distinto al de sandbox).
- `DATABASE_URL` (Postgres real).
- `WHATSAPP_NUMBER` + `WHATSAPP_MODE=PRODUCTION` — **recién aquí** se activa
  el envío real (ver BN-009); revisar el número con cuidado antes.
- `GOOGLE_DRIVE_MODE=REAL` + `GOOGLE_DRIVE_CLIENT_ID/SECRET` +
  `GOOGLE_DRIVE_FOLDER_ID` — requiere además completar el flujo OAuth que
  `services/drive.ts` deja marcado como pendiente (lanza error explícito si
  se activa sin esto).
- `ENVIRONMENT=PRODUCTION` — debe dejar de mostrarse el banner 🧪 SANDBOX en
  ambos frontends automáticamente (ya condicionado a esta variable).

## 3. Dominio y hosting
- Backend: cualquier host Node.js (Railway, Render, Fly.io, un VPS con
  PM2/systemd). Exponer solo `443` (HTTPS) hacia afuera.
- Frontends: build estático (`npm run build` en cada uno) servido desde un
  CDN/hosting estático (Vercel, Netlify, S3+CloudFront) o el mismo backend
  sirviendo `dist/`.
- Configurar `VITE_API_URL` de cada frontend apuntando al dominio real del
  backend, y `CORS_ORIGIN` del backend apuntando a los dominios reales de
  los frontends.

## 4. Seguridad (sección 36)
- [ ] Rotar `JWT_SECRET`, nunca reusar el de sandbox.
- [ ] Forzar HTTPS en todos los dominios.
- [ ] Revisar que ningún `.env` real llegue a GitHub (ver `.gitignore`, ya
      configurado).
- [ ] Cambiar las contraseñas demo (`Demo1234!`) de los 4 usuarios semilla
      o eliminarlos antes de ir a producción.
- [ ] Limitar CORS a los dominios reales (no `*`).
- [ ] Añadir rate limiting al login (no implementado aún — recomendado
      antes de producción).

## 5. Backups
- Sandbox: backup local vía `POST /api/drive/backup` (ver Fase 9).
- Producción: automatizar ese mismo endpoint con un cron/scheduled job, y
  una vez completado el OAuth de Drive, que el backup se suba ahí en vez de
  quedarse solo en disco local del servidor.

## 6. Checklist final antes de "ir en vivo"
- [ ] Todos los TEST 01-15 y ESCENARIOS A-E (`npm run test:integration`)
      pasan contra la base de datos de producción en un entorno de staging.
- [ ] Revisión manual de la matriz de roles (TEST 14) con usuarios reales,
      no solo los demo.
- [ ] `WHATSAPP_MODE=PRODUCTION` probado primero con el propio número del
      administrador antes de anunciarlo a las familias.
- [ ] Backup reciente confirmado antes del primer día real de ventas.
