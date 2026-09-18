/**
 * Limpia TODOS los datos de demo para pasar a modo productivo.
 *
 * Conserva (no se toca):
 *   - Users, Role, Permission, RolePermission, UserRole  (tu login sigue igual)
 *   - Setting                                             (tu configuración ya ajustada)
 *   - AuditLog                                             (es un registro histórico, no demo)
 *
 * Borra (contenido/datos de ejemplo):
 *   - Pedidos (Order, OrderItem, OrderStatusHistory, Student)
 *   - Ventas (Sale, SaleItem)
 *   - Nómina (PayrollDay, Payroll, Employee)
 *   - Renta (Rent)
 *   - Gastos (Expense, ExpenseCategory)
 *   - Metas y Ahorro (Goal, Savings)
 *   - Vacaciones (VacationPeriod)
 *   - Ventas/Gastos del día (Income, DailyExpense)
 *   - Tienda (Product, Category, DailyMenu, DailyMenuItem, Carousel, CarouselImage)
 *
 * Seguridad: no hace nada a menos que se pase CONFIRM_CLEAR_DEMO=yes — para
 * que nunca se ejecute por accidente en un build normal.
 */
import { prisma } from "../src/config/prisma.js";

async function main() {
  if (process.env.CONFIRM_CLEAR_DEMO !== "yes") {
    console.log("⛔ No se hizo nada. Para confirmar, corre con CONFIRM_CLEAR_DEMO=yes");
    return;
  }

  console.log("🧹 Borrando datos de demo (se conservan usuarios, roles y configuración)...");

  await prisma.orderStatusHistory.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.student.deleteMany({});

  await prisma.saleItem.deleteMany({});
  await prisma.sale.deleteMany({});

  await prisma.payrollDay.deleteMany({});
  await prisma.payroll.deleteMany({});
  await prisma.employee.deleteMany({});

  await prisma.rent.deleteMany({});

  await prisma.expense.deleteMany({});
  await prisma.expenseCategory.deleteMany({});
  await prisma.recurringExpense.deleteMany({});

  await prisma.goal.deleteMany({});
  await prisma.savings.deleteMany({});

  await prisma.vacationPeriod.deleteMany({});
  await prisma.schoolCalendar.deleteMany({});

  await prisma.income.deleteMany({});
  await prisma.dailyExpense.deleteMany({});

  await prisma.dailyMenuItem.deleteMany({});
  await prisma.dailyMenu.deleteMany({});

  await prisma.carouselImage.deleteMany({});
  await prisma.carousel.deleteMany({});

  await prisma.saleItem.deleteMany({}).catch(() => {}); // por si quedó alguno colgado
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});

  console.log("✅ Listo. La base de datos quedó vacía de contenido, lista para producción.");
  console.log("   Tus usuarios, roles y configuración (Configuración) siguen intactos.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
