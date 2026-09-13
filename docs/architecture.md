# Arquitectura — Tendita Landy

```
Usuarios (Admin / Padres)
        │
        ▼
04_frontend_admin (React+TS+Vite+Tailwind)   05_frontend_store (React+TS+Vite+Tailwind)
        │                                             │
        └───────────────────┬─────────────────────────┘
                             ▼
                 03_backend (Node.js + Express + TS)
                    ├── routes/*        (un archivo por recurso, sección 44)
                    ├── middleware/     (auth JWT, requireRole/requirePermission, validate, errors)
                    ├── services/       (financeCalculations, permissions, drive, audit)
                    └── utils/crudRouter (factory CRUD genérico)
                             │
                             ▼
                 02_database/prisma/schema.prisma  (fuente única del modelo de datos)
                             │
                             ▼
                    SQLite (sandbox) → PostgreSQL (producción, mismo schema)
```

## Principios que rigen el diseño
- **Sin inventario**: ningún modelo, campo ni endpoint relacionado con stock/existencias (regla absoluta, sección 0).
- **Todo configurable**: valores financieros y de negocio viven en la tabla `Setting`, nunca hardcoded (sección 2).
- **Roles → Permisos**: 4 roles (`ADMINISTRADOR`, `GESTION`, `OPERADOR`, `PADRE`) mapeados a un catálogo de permisos (`services/permissionCatalog.ts`), aplicado tanto en middleware de rutas como en la sidebar del admin.
- **Auditoría automática**: cualquier CREATE/UPDATE/DELETE sobre un recurso financiero pasa por `logAudit()` (BN-008).
- **WhatsApp/Drive nunca automáticos**: el sistema prepara el mensaje/archivo; una persona siempre confirma el envío (BN-009/BN-010).

Ver `/01_requirements/business-rules.md` para el detalle de cada regla de negocio (BN-001 a BN-010).
