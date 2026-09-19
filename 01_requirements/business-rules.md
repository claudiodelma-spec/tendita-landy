TENDITA LANDY — Reglas de Negocio
Formato: ID · Nombre · Descripción · Entrada · Proceso · Resultado · Configuración · Impacto
---
BN-001 — Renta periódica
Descripción: La renta se paga según la periodicidad configurada (no fija a semanal).
Entrada: valor, periodicidad, fecha inicio/fin.
Proceso: se suma al total de "pagos previstos" del periodo activo.
Resultado: monto incluido en proyección financiera y en ahorro diario necesario.
Configuración: 100% editable desde Configuración → Rentas. Histórico conservado (no se sobreescribe).
Impacto: Dashboard, Proyección, Ahorro diario.
BN-002 — Nómina por día trabajado
Descripción: Cada empleado cobra `salario_diario × días_trabajados` en el periodo.
Entrada: salario diario por empleado, marca de asistencia por día.
Proceso: `total_nomina = Σ (salario_diario_i × días_trabajados_i)`. Si no hay clases/no se trabaja, el día no se cuenta.
Resultado: si nadie trabaja, nómina = $0.
Configuración: salario diario y calendario de asistencia editables por empleado.
Impacto: Dashboard, Gastos, Proyección.
BN-003 — Gastos por periodicidad
Descripción: Los gastos se clasifican en diario/semanal/mensual/anual/extraordinario.
Entrada: concepto, categoría, valor, fecha, periodicidad.
Proceso: se normalizan a valor diario equivalente para la proyección cuando aplica.
Resultado: afecta ganancia neta y ahorro necesario.
Configuración: categorías y montos 100% editables.
Impacto: Dashboard, Reportes, Ahorro diario.
BN-004 — Ahorro diario necesario (cálculo central)
Descripción: Monto que se debe ahorrar/generar cada día para cubrir obligaciones futuras.
Entrada: renta, nómina, gastos recurrentes/registrados, metas, fondo de vacaciones, ahorro acumulado, días restantes.
Proceso:
```
pagos_previstos = renta_prevista + nomina_prevista + gastos_previstos
dinero_disponible = ahorro_acumulado + ingresos_previstos
necesidad_restante = pagos_previstos + metas_pendientes + fondo_vacaciones_faltante - dinero_disponible
ahorro_diario_necesario = necesidad_restante / días_restantes
```
Resultado: valor mostrado en la tarjeta destacada "Ahorro necesario hoy".
Configuración: se recalcula automáticamente cuando cualquier valor de entrada cambia.
Impacto: Dashboard (tarjeta destacada), Alertas.
BN-005 — Meta con seguimiento
Descripción: Cada meta (diaria/semanal/mensual/anual/personalizada) muestra objetivo, acumulado, faltante, % y necesidad diaria.
Entrada: valor objetivo, fecha inicio/fin, valor acumulado.
Proceso: `faltante = objetivo - acumulado`; `necesidad_diaria = faltante / días_restantes`.
Resultado: barra de progreso + necesidad diaria.
Configuración: metas creables/editables sin límite.
Impacto: Dashboard, Metas y Ahorro, Reportes.
BN-006 — Fondo de vacaciones
Descripción: Un fondo objetivo se divide entre los días disponibles antes del periodo vacacional.
Entrada: objetivo económico, ahorro actual, días del periodo.
Proceso: `ahorro_diario = (objetivo - ahorro_actual) / días_restantes_antes_de_vacaciones`.
Resultado: monto diario necesario específico para vacaciones.
Configuración: editable por periodo vacacional.
Impacto: Dashboard, Vacaciones, Alertas.
BN-007 — Producto sin inventario
Descripción: Los productos NUNCA tienen stock/cantidad. Solo estado ACTIVO/INACTIVO.
Entrada: nombre, precio, categoría, estado.
Proceso: un producto INACTIVO no se muestra en la tienda; no hay descuento de existencias al vender.
Resultado: disponibilidad puramente manual.
Configuración: activar/desactivar desde Panel → Productos.
Impacto: Tienda, Pedidos. Prohibido: cualquier campo o lógica de stock/kardex.
BN-008 — Auditoría de cambios financieros
Descripción: Todo cambio a un valor financiero configurable queda registrado.
Entrada: usuario, módulo, valor anterior, valor nuevo.
Proceso: se crea un `AuditLog` en cada UPDATE de Rent, Payroll(Employee), Expense, Goal, Savings, VacationPeriod, Setting.
Resultado: trazabilidad completa (quién, cuándo, qué cambió).
Configuración: no editable/desactivable por el usuario.
Impacto: Auditoría, Reportes.
---
Documento vivo — se amplía en cada fase según sección 49 del spec (aprobación por fase).
BN-009 — Envío de WhatsApp siempre manual, número configurable
Descripción: El sistema nunca envía el pedido por WhatsApp automáticamente; solo prepara el número (configurable) y el mensaje, y abre `wa.me` con el texto ya escrito — el padre debe presionar "Enviar" dentro de la app de WhatsApp.
Entrada: `whatsapp.number` (Setting, editable en Configuración); `WHATSAPP_MODE` (SANDBOX/PRODUCTION, solo en `.env`, no editable desde la UI).
Proceso: `POST /api/orders` construye el mensaje exacto de la sección 30 y arma la URL `https://wa.me/<numero>?text=<mensaje>` con el número leído de `Setting` (fallback a `.env` si aún no se ha configurado).
Resultado: ningún pedido se envía "solo"; siempre requiere una acción explícita del padre en su propio WhatsApp.
Configuración: el número se edita en Configuración → WhatsApp (sección 33) sin tocar código. El modo SANDBOX/PRODUCTION se mantiene deliberadamente fuera del alcance de la UI — es una salvaguarda contra activar envíos reales por error desde el panel.
Impacto: Tienda (checkout), Configuración.
BN-010 — Google Drive nunca es la base de datos; sandbox siempre mock explícito
Descripción: Drive se usa solo para imágenes/carrusel/reportes/backups (sección 35), nunca como almacén de datos operativos — esos siguen en la base de datos relacional.
Entrada: `GOOGLE_DRIVE_MODE` (`MOCK` en sandbox, `.env`).
Proceso: en modo `MOCK`, `POST /api/drive/upload` genera una URL simulada (`drive.mock.local/...`) sin tocar ninguna API externa; `POST /api/drive/backup` sí escribe un respaldo real pero local (`03_backend/storage/backups/*.json`) con las tablas de configuración crítica (Settings, Rentas, Empleados, Metas, Vacaciones). Si alguien cambia `GOOGLE_DRIVE_MODE` a `REAL` sin haber implementado el flujo OAuth, el sistema falla explícitamente en vez de fingir que subió el archivo.
Resultado: nunca hay una subida "silenciosa" que aparente ser real sin serlo.
Configuración: el modo se mantiene solo en `.env` (mismo criterio de seguridad que BN-009 con WhatsApp) — se muestra como solo-lectura en Configuración.
Impacto: Carrusel, Configuración, Backups.
BN-011 — Corrección "Dashboard financiero" (Ventas/Gastos del día manuales)
Descripción: El Dashboard ya no calcula Ventas del día a partir de pedidos entregados ni Gastos del día a partir de la lista de gastos categorizados — ambos son ahora valores manuales, un único registro por día (upsert), editables desde el propio Dashboard.
Entrada: `Income` (reutilizado, ya existía sin uso desde la Fase 1) para Ventas; `DailyExpense` (modelo nuevo) para Gastos — deliberadamente separado de `Expense` para no romper la pantalla Gastos ni los Reportes, que siguen usando el modelo `Expense` categorizado sin cambios.
Proceso: `POST /api/income` y `POST /api/daily-expenses` hacen upsert por fecha (normalizada a medianoche) — editar el mismo día actualiza el registro existente, nunca duplica. Ganancia neta = Ventas del día − Gastos del día, siempre calculada, nunca editable directamente.
Resultado: `GET /api/reports/dashboard?date=YYYY-MM-DD` devuelve únicamente los 7 indicadores pedidos (Ventas, Gastos, Ganancia neta, Objetivo total, Ahorro diario necesario, Ahorro acumulado, Falta ahorrar) — Total alumnos fue retirado del Dashboard por completo.
Configuración: Objetivo principal y Fondo de vacaciones son `Setting` (`savings.mainGoal`, `savings.vacationFund`, categoría FINANCE, reutilizando la tabla ya existente) — Objetivo total = suma de ambos, nunca un indicador independiente. Ahorro acumulado reutiliza el modelo `Savings` ya existente (mismo botón "Registrar ahorro" de Metas y Ahorro). El ahorro nunca se registra automáticamente solo porque haya ganancia neta — sección 20 del documento de corrección.
Impacto: Dashboard, Configuración. Las páginas Metas y Ahorro / Vacaciones (con sus propios Goal/VacationPeriod, CRUD completo) no se modificaron — siguen funcionando igual, son un sistema aparte del resumen del Dashboard.
BN-012 — Tienda para padres 100% pública, sin cuentas
Descripción: La tienda (`05_frontend_store`) ya no requiere iniciar sesión — cualquier visitante navega categorías/productos/menú/carrusel y arma su pedido sin usuario ni contraseña.
Entrada/Proceso: nuevo namespace `GET /api/public/categories|products|menu/today|carousel|business-info` y `POST /api/public/orders` — ninguno usa `requireAuth`. El pedido se crea sin `userId` (queda `null`), identificado solo por los datos del alumno. El panel admin (`/api/orders`, autenticado) sigue viendo y gestionando todos los pedidos igual que antes.
Resultado: el rol `PADRE` deja de ser necesario para comprar — sigue existiendo en el sistema de roles/permisos (por si se necesita en el futuro) pero la tienda ya no lo usa.
Fotos reales sin servicios externos: `components/ImageUploadInput.tsx` (panel admin) permite subir una foto real desde el dispositivo — se redimensiona/comprime en el propio navegador (canvas, máx. ~900px, JPEG 82%) y se guarda como `data:image/jpeg;base64,...` directamente en `imageUrl`. No depende de Google Drive, S3 ni ningún servicio pago. Usado en Productos y Carrusel.
Impacto: Tienda (pública), Productos, Carrusel. Panel admin, `/api/orders`, roles y permisos no cambiaron.
BN-013 — Ajuste posterior: Renta/Nómina/Gastos unificados, Ahorro operativo, Meta de ganancia, evolución
Descripción: El administrador pidió 4 ajustes sobre BN-011 sin deshacer nada de lo construido:
Renta, Nómina y Gastos en una sola pantalla (`GestionOperativaPage.tsx`, con pestañas) — el menú lateral pasó de 3 entradas a 1 ("Renta, Nómina y Gastos"). Los 3 modelos (`Rent`, `Employee`/`PayrollDay`, `Expense`) y sus endpoints no cambiaron, solo la pantalla que los agrupa.
"Ahorro" reinterpretado como gasto operativo: revive `computeDailySavingsNeeded` (BN-004, que había quedado sin usar desde BN-011) en una versión más simple — `computeOperationalDailyNeed()` sólo con Renta+Nómina+Gastos normalizados a una semana, sin mezclar metas/vacaciones. Se muestra como tarjeta aparte en el Dashboard ("Ahorro para gastos operativos").
Meta de ganancia (nuevo): `finance.profitGoal` + fechas (`Setting`, categoría FINANCE) — el sistema calcula solo la ganancia acumulada real (Σ Ventas del día − Σ Gastos del día) y la ganancia diaria necesaria para llegar a la meta. El sistema de Metas manuales (`Goal`, sección BN-005) sigue existiendo sin cambios para objetivos adicionales que el administrador quiera trackear aparte.
Evolución semanal/mensual/histórico: `GET /api/reports/evolution?range=week|month|history` + gráfico de líneas (Ventas/Gastos/Ganancia) en el Dashboard.
CRUD completo en todas las pantallas: se agregó editar y eliminar donde solo existía crear/activar — Renta, Nómina, Gastos (en la pantalla unificada), Metas, Ahorro, Vacaciones, Productos, Categorías, Usuarios (`PUT`/`DELETE /api/users/:id` son nuevos).
Impacto: Dashboard, menú lateral (Renta/Nómina/Gastos fusionados), Metas y Ahorro, Vacaciones, Productos, Categorías, Usuarios, Configuración (nuevas claves `finance.profitGoal*`). Vacaciones y el Objetivo de ahorro (BN-011) siguen siendo una cuenta aparte del Ahorro operativo, tal como pidió el usuario.
BN-014 — Ajuste fino del Dashboard, fórmula de gastos operativos, logo con foto real, limpieza de demo
Descripción: 4 correcciones más sobre el Dashboard/Configuración, sin tocar nada que ya funcionaba:
Historial en el Dashboard: tabla con Ventas/Gastos/Ganancia día por día (además del gráfico ya existente de BN-013), usando los mismos datos de `computeEvolution`.
Fórmula de "Ahorro para gastos operativos" corregida: ahora es Renta + Nómina + Gastos fijos (`Expense`, categorizados) + Gastos del día (`DailyExpense`, últimos 7 días) — antes solo sumaba Renta+Nómina+Gastos fijos, sin contar los gastos manuales del Resumen del día.
"Objetivo de ahorro y vacaciones" (BN-011) retirado del Dashboard: no tenía sentido como valor plano en Settings. Se reemplazó por `computeVacationDashboardCard()`, que lee el periodo de vacaciones real más próximo (`VacationPeriod`, pantalla Vacaciones — sin ningún cambio ahí) y calcula el ahorro diario necesario real. Las 4 claves de Settings (`savings.mainGoal`, `savings.vacationFund`, `savings.targetStartDate`, `savings.targetEndDate`) no se borraron de la base de datos — solo se ocultaron de Configuración por quedar sin uso.
Logo con foto real: el campo "Logo (URL)" de Configuración ahora usa el mismo `ImageUploadInput` que Productos/Carrusel (arrastrar y soltar, comprime en el navegador).
`prisma/clear-demo-data.ts`: script nuevo, protegido con `CONFIRM_CLEAR_DEMO=yes` para que nunca se ejecute por accidente. Borra todo el contenido de ejemplo (productos, categorías, pedidos, empleados, renta, gastos, metas, ahorro, vacaciones, ventas/gastos del día, menú, carrusel) — conserva usuarios, roles y Configuración.
Impacto: Dashboard, Configuración. Nada del backend existente (rutas, modelos) se eliminó — solo se agregó `computeVacationDashboardCard` y se corrigió `computeOperationalDailyNeed`.
BN-015 — Simplificación del panel + tienda más colorida
Descripción: El usuario decidió que el negocio es más simple de lo que el spec original preveía — no necesita seguimiento individual de pedidos ni los sistemas de Metas/Vacaciones en el panel.
Historial editable: la tabla de Ventas/Gastos/Ganancia por día ahora tiene editar (te lleva al selector de fecha del Resumen del día) y eliminar (nuevo `DELETE /api/income/:id` y `DELETE /api/daily-expenses/:id`).
"Ahorro para gastos operativos" se movió arriba del todo en el Dashboard — es el indicador que más usa.
Se quitaron del menú y las rutas del panel: Pedidos (WhatsApp), Metas y Ahorro, Vacaciones. Los pedidos por WhatsApp se generan igual desde la tienda (`POST /api/public/orders` sigue intacto — el checkout de la tienda no cambió); el administrador simplemente suma manualmente el total del día y lo carga en "Ventas del día", en vez de llevar cada pedido por separado. El cartón "Ahorro para vacaciones" (que leía `VacationPeriod`) también se quitó del Dashboard.
Nada del backend se borró — `/api/orders`, `/api/goals`, `/api/savings`, `/api/vacations` siguen funcionando por si se necesitan de nuevo; solo dejaron de tener pantalla en el panel.
Tienda con más color: el logo real (subido en Configuración) ahora se muestra en la tienda en vez del círculo "TL"; fondo con gradiente rosa/naranja/amarillo; tarjetas de producto con una paleta de 5 colores rotando por producto; categorías con degradado rosa-fucsia al seleccionar.
Impacto: Dashboard (reordenado, sin Vacaciones), menú lateral (3 entradas menos), Configuración (sin cambios adicionales), Tienda (visual). `PedidosPage.tsx`, `MetasAhorroPage.tsx`, `VacacionesPage.tsx` se eliminaron del frontend admin (el backend permanece intacto).
