# 08_tests — Pruebas (Fase 11)

Las pruebas automatizadas viven dentro de `03_backend` (mismo motivo que
`02_database/NOTA_ESTRUCTURA.md`: necesitan el `node_modules` del backend
para resolver `@prisma/client`, `supertest`, `vitest`, etc.):

- `03_backend/src/middleware/__tests__/auth.test.ts` — **unitarias**, sin
  base de datos. Cubren TEST 14 (ROLES). Corren con `npm run test`.
- `03_backend/tests/integration/business-rules.test.ts` — **integrales**,
  contra la API real (supertest) y una base de datos SQLite separada
  (`prisma-test.db`, nunca `dev.db`). Cubren los **TEST 01 a 15** y los
  **ESCENARIOS A a E** de las secciones 41/42 del spec. Corren con
  `npm run test:integration`.

## Por qué no corrieron aquí

`test:integration` necesita `prisma db push` (equivalente a `prisma
generate`), que descarga el motor de Prisma desde `binaries.prisma.sh` —
dominio fuera de la lista permitida en este entorno de chat (mismo bloqueo
de red documentado desde la Fase 1). El código está escrito, tipado sin
errores (`npm run typecheck` y `npm run typecheck:tests`) y listo para
correr en cualquier máquina con red completa.

## Cómo correrlas de verdad

```bash
cd 03_backend
npm install
npm run test              # unitarias — TEST 14 (8/8)
npm run test:integration   # integrales — TEST 01-15 + ESCENARIOS A-E
```

## Checklist manual (por si prefieres probar a mano en el navegador)

Cada fila corresponde a un test automatizado ya escrito —úsalo como
checklist si quieres reproducirlo manualmente en el panel:

| # | Prueba | Dónde probarlo a mano |
|---|--------|------------------------|
| 01 | Renta $2,500→$3,000 | Rentas → nuevo periodo → cambiar valor |
| 02 | Nómina 5→4 días ($1,000→$800) | Nómina → destildar un día |
| 03 | Gasto $7,000→$8,000 | Gastos → editar monto |
| 04 | Meta $30,000, necesidad diaria | Metas y Ahorro |
| 05 | Ahorro reduce faltante | Metas y Ahorro → Registrar ahorro |
| 06 | Vacaciones $30,000 | Vacaciones |
| 07/08 | Producto aparece; categoría desactivada desaparece | Productos / Categorías |
| 09 | Menú aparece en su fecha | Menú Diario |
| 10 | Máximo 5 imágenes activas | Carrusel (6ª imagen debe rechazarse) |
| 11 | Carrito $30+$15=$45 | Tienda → agregar 2 productos |
| 12/13 | Pedido + mensaje de WhatsApp | Tienda → Checkout |
| 14 | Roles (Padre/Operador/Gestión/Admin) | Iniciar sesión con cada usuario demo |
| 15 | Auditoría registra el cambio | Auditoría, tras editar una Renta |
