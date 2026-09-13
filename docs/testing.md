# Pruebas — Fase 11

Ver también `/08_tests/README.md` (checklist manual) y el archivo real de
pruebas: `03_backend/tests/integration/business-rules.test.ts`.

## Unitarias (sin base de datos)
```bash
cd 03_backend && npm run test
```
Cubren el TEST 14 (ROLES) a nivel de lógica pura de permisos.

## Integrales (con base de datos SQLite separada)
```bash
cd 03_backend && npm run test:integration
```
Cubren TEST 01 a 15 y ESCENARIOS A a E (secciones 41/42 del spec) contra la
API real, con `supertest`. Usan `prisma-test.db` — nunca tocan `dev.db`.

## Qué NO está automatizado todavía
- Pruebas end-to-end de interfaz (Playwright/Cypress) sobre los frontends
  React — hoy la cobertura de UI es manual (ver checklist en `/08_tests`).
- Pruebas de carga/rendimiento.
- Pruebas de la integración real de WhatsApp/Google Drive (no implementadas
  a propósito hasta producción, ver `deployment.md`).
