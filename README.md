# TENDITA LANDY — Sistema de Gestión Escolar + Tienda para Padres

⚠️ **SANDBOX / DEMO** — sin datos reales, sin WhatsApp real, sin Google Drive real hasta aprobar todas las pruebas (ver sección 50 del spec original).

## Estado (Fase 12 — TODAS las fases completadas)
- [x] Fases 0–10: arquitectura, backend completo, autenticación/roles, admin (Dashboard, Rentas, Nómina, Gastos, Metas y Ahorro, Vacaciones, Productos, Categorías, Menú, Carrusel, Pedidos, Configuración, Reportes, Usuarios, Auditoría), tienda para padres, WhatsApp configurable, Google Drive mock + backups
- [x] **Fase 11 — Pruebas integrales**: 15 TEST + 5 ESCENARIOS de las secciones 41/42 escritos como pruebas automatizadas (`03_backend/tests/integration/business-rules.test.ts`) contra la API real vía `supertest`. Tipado sin errores (`npm run typecheck:tests`). **No se pudieron ejecutar en este chat** por el mismo bloqueo de red a `binaries.prisma.sh` documentado desde la Fase 1 — listas para correr en cualquier máquina normal
- [x] **Fase 12 — Preparación para producción**: `docs/deployment.md` con la checklist completa (base de datos, variables de entorno, dominio/hosting, seguridad, backups, checklist final). Documentación completa en `/docs` (architecture, database, business-rules, installation, testing, user-guide) según sección 52
- [x] Nada de esto se conectó a producción real — cumpliendo la sección 50 al pie de la letra

## Usuarios demo (password para todos: `Demo1234!`)
| Email | Rol |
|---|---|
| admin@tenditalandy.demo | ADMINISTRADOR |
| gestion@tenditalandy.demo | GESTION |
| operador@tenditalandy.demo | OPERADOR |
| padre@tenditalandy.demo | PADRE |








## Estructura
```
01_requirements/    business-rules.md
02_database/         prisma/schema.prisma, prisma/seed.ts
03_backend/           Node.js + TypeScript API (por construir - Fase 1)
04_frontend_admin/   Panel de gestión (Vite + React + TS + Tailwind)
05_frontend_store/   Tienda para padres (por construir - Fase 5)
06_whatsapp/          Generador de mensajes (Fase 7)
07_dashboard/         (reservado)
08_tests/             Pruebas (Fase 11)
09_production/        Estrategia de despliegue (Fase 12)
docs/                 architecture.md, database.md, etc.
```

## Regla absoluta
🚫 No existe, ni existirá en esta primera versión, ningún concepto de inventario, stock, existencias, kardex o proveedor de inventario. La disponibilidad de productos es únicamente ACTIVO / INACTIVO.

## Siguiente paso — lo único que falta
1. Correr `npm run test:integration` en una máquina con red normal y revisar que los 15 TEST + 5 ESCENARIOS pasen contra tu propia base de datos.
2. Seguir la checklist de `docs/deployment.md` cuando decidas ir a producción de verdad (WhatsApp real, Drive real, Postgres, dominio).

Todo lo demás — las 44 secciones funcionales del spec — ya está construido y verificado con `typecheck`/`build` en este chat.

## Cómo levantar el proyecto completo en un entorno con red completa
```bash
# Backend
cd 03_backend
cp ../.env.example .env
npm install
npx prisma generate --schema=../02_database/prisma/schema.prisma
npm run seed
npm run dev            # http://localhost:4000

# Frontend admin (otra terminal)
cd 04_frontend_admin
cp .env.example .env
npm install
npm run dev             # http://localhost:5173

# Frontend store / tienda para padres (otra terminal)
cd 05_frontend_store
cp .env.example .env
npm install
npm run dev             # http://localhost:5174
```

