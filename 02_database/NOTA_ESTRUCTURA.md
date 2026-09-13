# Nota de estructura — Fase 2 (corrección)

`schema.prisma` (fuente única de verdad del modelo de datos) vive aquí, en
`02_database/prisma/schema.prisma`, tal como pide la sección 4 del spec.

`seed.ts`, sin embargo, se movió a `03_backend/prisma/seed.ts`.

**Motivo:** `seed.ts` es un script de Node que importa `@prisma/client`,
`bcryptjs` y código propio del backend. La resolución de módulos de Node
busca `node_modules` subiendo desde la carpeta del archivo — y
`node_modules` solo existe dentro de `03_backend`. Con `seed.ts` en
`02_database/prisma/`, `npm run seed` fallaba con `Cannot find module
'@prisma/client'` incluso con las dependencias instaladas correctamente.

No hay duplicación del schema: `03_backend` sigue generando el cliente de
Prisma apuntando a `../02_database/prisma/schema.prisma`
(`npx prisma generate --schema=../02_database/prisma/schema.prisma`, ya
configurado). Solo el script ejecutable de seed cambió de ubicación.
