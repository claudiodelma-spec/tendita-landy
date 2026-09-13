# Base de datos — Tendita Landy

Fuente única de verdad: `02_database/prisma/schema.prisma`.

## Grupos de modelos
- **Usuarios y permisos**: `User`, `Role`, `Permission`, `RolePermission`, `UserRole`
- **Configuración**: `Setting` (todo valor de negocio configurable, sección 2)
- **Nómina**: `Employee`, `Payroll`, `PayrollDay`
- **Gastos**: `Expense`, `ExpenseCategory`, `RecurringExpense`
- **Renta**: `Rent` (histórico conservado, nunca sobrescrito — BN-001)
- **Ingresos/Ventas**: `Income`, `Sale`, `SaleItem`
- **Tienda (sin stock)**: `Category`, `Product` — el único campo de disponibilidad es `status: ACTIVO | INACTIVO`
- **Metas y ahorro**: `Goal`, `Savings`
- **Calendario/Vacaciones**: `SchoolCalendar`, `VacationPeriod`
- **Menú/Carrusel**: `DailyMenu`, `DailyMenuItem`, `Carousel`, `CarouselImage`
- **Pedidos**: `Student`, `Order`, `OrderItem`, `OrderStatusHistory`
- **Sistema**: `Notification`, `AuditLog`

## Sandbox vs. producción
- Sandbox: `provider = "sqlite"`, archivo `dev.db` local.
- Producción: cambiar `provider` a `"postgresql"` y `DATABASE_URL` a la cadena de conexión real — **sin tocar ningún modelo** (ver `docs/deployment.md`).

## Comandos
```bash
cd 03_backend
npx prisma generate --schema=../02_database/prisma/schema.prisma
npx prisma db push --schema=../02_database/prisma/schema.prisma   # sandbox, sin migraciones formales
npm run seed
```

Para producción se recomienda pasar a `prisma migrate deploy` con migraciones versionadas en vez de `db push` (ver `docs/deployment.md`).
