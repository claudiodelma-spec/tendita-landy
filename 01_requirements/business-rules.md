# TENDITA LANDY — Reglas de Negocio

Formato: ID · Nombre · Descripción · Entrada · Proceso · Resultado · Configuración · Impacto

---

## BN-001 — Renta periódica
**Descripción:** La renta se paga según la periodicidad configurada (no fija a semanal).
**Entrada:** valor, periodicidad, fecha inicio/fin.
**Proceso:** se suma al total de "pagos previstos" del periodo activo.
**Resultado:** monto incluido en proyección financiera y en ahorro diario necesario.
**Configuración:** 100% editable desde Configuración → Rentas. Histórico conservado (no se sobreescribe).
**Impacto:** Dashboard, Proyección, Ahorro diario.

## BN-002 — Nómina por día trabajado
**Descripción:** Cada empleado cobra `salario_diario × días_trabajados` en el periodo.
**Entrada:** salario diario por empleado, marca de asistencia por día.
**Proceso:** `total_nomina = Σ (salario_diario_i × días_trabajados_i)`. Si no hay clases/no se trabaja, el día no se cuenta.
**Resultado:** si nadie trabaja, nómina = $0.
**Configuración:** salario diario y calendario de asistencia editables por empleado.
**Impacto:** Dashboard, Gastos, Proyección.

## BN-003 — Gastos por periodicidad
**Descripción:** Los gastos se clasifican en diario/semanal/mensual/anual/extraordinario.
**Entrada:** concepto, categoría, valor, fecha, periodicidad.
**Proceso:** se normalizan a valor diario equivalente para la proyección cuando aplica.
**Resultado:** afecta ganancia neta y ahorro necesario.
**Configuración:** categorías y montos 100% editables.
**Impacto:** Dashboard, Reportes, Ahorro diario.

## BN-004 — Ahorro diario necesario (cálculo central)
**Descripción:** Monto que se debe ahorrar/generar cada día para cubrir obligaciones futuras.
**Entrada:** renta, nómina, gastos recurrentes/registrados, metas, fondo de vacaciones, ahorro acumulado, días restantes.
**Proceso:**
```
pagos_previstos = renta_prevista + nomina_prevista + gastos_previstos
dinero_disponible = ahorro_acumulado + ingresos_previstos
necesidad_restante = pagos_previstos + metas_pendientes + fondo_vacaciones_faltante - dinero_disponible
ahorro_diario_necesario = necesidad_restante / días_restantes
```
**Resultado:** valor mostrado en la tarjeta destacada "Ahorro necesario hoy".
**Configuración:** se recalcula automáticamente cuando cualquier valor de entrada cambia.
**Impacto:** Dashboard (tarjeta destacada), Alertas.

## BN-005 — Meta con seguimiento
**Descripción:** Cada meta (diaria/semanal/mensual/anual/personalizada) muestra objetivo, acumulado, faltante, % y necesidad diaria.
**Entrada:** valor objetivo, fecha inicio/fin, valor acumulado.
**Proceso:** `faltante = objetivo - acumulado`; `necesidad_diaria = faltante / días_restantes`.
**Resultado:** barra de progreso + necesidad diaria.
**Configuración:** metas creables/editables sin límite.
**Impacto:** Dashboard, Metas y Ahorro, Reportes.

## BN-006 — Fondo de vacaciones
**Descripción:** Un fondo objetivo se divide entre los días disponibles antes del periodo vacacional.
**Entrada:** objetivo económico, ahorro actual, días del periodo.
**Proceso:** `ahorro_diario = (objetivo - ahorro_actual) / días_restantes_antes_de_vacaciones`.
**Resultado:** monto diario necesario específico para vacaciones.
**Configuración:** editable por periodo vacacional.
**Impacto:** Dashboard, Vacaciones, Alertas.

## BN-007 — Producto sin inventario
**Descripción:** Los productos NUNCA tienen stock/cantidad. Solo estado ACTIVO/INACTIVO.
**Entrada:** nombre, precio, categoría, estado.
**Proceso:** un producto INACTIVO no se muestra en la tienda; no hay descuento de existencias al vender.
**Resultado:** disponibilidad puramente manual.
**Configuración:** activar/desactivar desde Panel → Productos.
**Impacto:** Tienda, Pedidos. **Prohibido:** cualquier campo o lógica de stock/kardex.

## BN-008 — Auditoría de cambios financieros
**Descripción:** Todo cambio a un valor financiero configurable queda registrado.
**Entrada:** usuario, módulo, valor anterior, valor nuevo.
**Proceso:** se crea un `AuditLog` en cada UPDATE de Rent, Payroll(Employee), Expense, Goal, Savings, VacationPeriod, Setting.
**Resultado:** trazabilidad completa (quién, cuándo, qué cambió).
**Configuración:** no editable/desactivable por el usuario.
**Impacto:** Auditoría, Reportes.

---
*Documento vivo — se amplía en cada fase según sección 49 del spec (aprobación por fase).*

## BN-009 — Envío de WhatsApp siempre manual, número configurable
**Descripción:** El sistema nunca envía el pedido por WhatsApp automáticamente; solo prepara el número (configurable) y el mensaje, y abre `wa.me` con el texto ya escrito — el padre debe presionar "Enviar" dentro de la app de WhatsApp.
**Entrada:** `whatsapp.number` (Setting, editable en Configuración); `WHATSAPP_MODE` (SANDBOX/PRODUCTION, solo en `.env`, no editable desde la UI).
**Proceso:** `POST /api/orders` construye el mensaje exacto de la sección 30 y arma la URL `https://wa.me/<numero>?text=<mensaje>` con el número leído de `Setting` (fallback a `.env` si aún no se ha configurado).
**Resultado:** ningún pedido se envía "solo"; siempre requiere una acción explícita del padre en su propio WhatsApp.
**Configuración:** el número se edita en Configuración → WhatsApp (sección 33) sin tocar código. El modo SANDBOX/PRODUCTION se mantiene deliberadamente fuera del alcance de la UI — es una salvaguarda contra activar envíos reales por error desde el panel.
**Impacto:** Tienda (checkout), Configuración.

## BN-010 — Google Drive nunca es la base de datos; sandbox siempre mock explícito
**Descripción:** Drive se usa solo para imágenes/carrusel/reportes/backups (sección 35), nunca como almacén de datos operativos — esos siguen en la base de datos relacional.
**Entrada:** `GOOGLE_DRIVE_MODE` (`MOCK` en sandbox, `.env`).
**Proceso:** en modo `MOCK`, `POST /api/drive/upload` genera una URL simulada (`drive.mock.local/...`) sin tocar ninguna API externa; `POST /api/drive/backup` sí escribe un respaldo real pero **local** (`03_backend/storage/backups/*.json`) con las tablas de configuración crítica (Settings, Rentas, Empleados, Metas, Vacaciones). Si alguien cambia `GOOGLE_DRIVE_MODE` a `REAL` sin haber implementado el flujo OAuth, el sistema **falla explícitamente** en vez de fingir que subió el archivo.
**Resultado:** nunca hay una subida "silenciosa" que aparente ser real sin serlo.
**Configuración:** el modo se mantiene solo en `.env` (mismo criterio de seguridad que BN-009 con WhatsApp) — se muestra como solo-lectura en Configuración.
**Impacto:** Carrusel, Configuración, Backups.


