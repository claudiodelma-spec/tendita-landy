/**
 * TENDITA LANDY — Seeder de datos DEMO (SANDBOX)
 * NUNCA usar en producción. Sin datos reales.
 */
import { Periodicity, OrderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../src/config/prisma.js";
import { seedPermissions } from "../src/services/permissions.js";

async function main() {
  console.log("🧪 Sembrando datos DEMO (SANDBOX)...");

  // --- Settings ---
  await prisma.setting.createMany({
    data: [
      { key: "business.name", value: "Tendita Landy", category: "BUSINESS" },
      { key: "business.logo", value: "/logo.png", category: "BUSINESS" },
      { key: "whatsapp.number", value: "+52 1 55 0000 0000 (PRUEBA)", category: "STORE" },
      { key: "finance.currency", value: "MXN", category: "FINANCE" },
      { key: "system.timezone", value: "America/Mexico_City", category: "SYSTEM" },
      { key: "system.environment", value: "SANDBOX", category: "SYSTEM" },
      { key: "carousel.maxImages", value: "5", category: "CAROUSEL" },
    ],
  });

  // --- Roles + Permissions (Fase 2: BN de control de permisos, sección 6) ---
  const roles = await Promise.all(
    ["ADMINISTRADOR", "GESTION", "OPERADOR", "PADRE"].map((name) =>
      prisma.role.create({ data: { name: name as any } })
    )
  );
  await seedPermissions();

  const adminPasswordHash = await bcrypt.hash("Demo1234!", 10);
  const admin = await prisma.user.create({
    data: {
      name: "Administrador Demo",
      email: "admin@tenditalandy.demo",
      passwordHash: adminPasswordHash,
      roles: { create: [{ roleId: roles[0].id }] },
    },
  });

  // --- Un usuario demo por cada rol restante (TEST 14 — ROLES) ---
  const demoPassword = await bcrypt.hash("Demo1234!", 10);
  await prisma.user.create({
    data: {
      name: "Gestión Demo",
      email: "gestion@tenditalandy.demo",
      passwordHash: demoPassword,
      roles: { create: [{ roleId: roles[1].id }] },
    },
  });
  await prisma.user.create({
    data: {
      name: "Operador Demo",
      email: "operador@tenditalandy.demo",
      passwordHash: demoPassword,
      roles: { create: [{ roleId: roles[2].id }] },
    },
  });
  await prisma.user.create({
    data: {
      name: "Padre Demo",
      email: "padre@tenditalandy.demo",
      passwordHash: demoPassword,
      roles: { create: [{ roleId: roles[3].id }] },
    },
  });

  // --- Categories ---
  const categoryData = [
    { name: "Comida", icon: "🍔" },
    { name: "Bebidas", icon: "🥤" },
    { name: "Snacks", icon: "🍫" },
    { name: "Frutas", icon: "🍎" },
    { name: "Dulces", icon: "🍭" },
    { name: "Combos", icon: "⭐" },
  ];
  const categories = [];
  for (const [i, c] of categoryData.entries()) {
    categories.push(
      await prisma.category.create({ data: { ...c, order: i } })
    );
  }

  // --- Products ---
  const productData = [
    { name: "Sándwich", price: 30, categoryName: "Comida" },
    { name: "Jugo natural", price: 15, categoryName: "Bebidas" },
    { name: "Fruta preparada", price: 20, categoryName: "Frutas" },
    { name: "Tacos", price: 25, categoryName: "Comida" },
    { name: "Agua de jamaica", price: 12, categoryName: "Bebidas" },
    { name: "Snack", price: 18, categoryName: "Snacks" },
    { name: "Dulce", price: 8, categoryName: "Dulces" },
  ];
  const products = [];
  for (const p of productData) {
    const cat = categories.find((c) => c.name === p.categoryName)!;
    products.push(
      await prisma.product.create({
        data: {
          name: p.name,
          price: p.price,
          categoryId: cat.id,
          status: "ACTIVO",
        },
      })
    );
  }

  // --- Employees (3) ---
  await prisma.employee.createMany({
    data: [
      { name: "Empleado Demo 1", dailySalary: 200, startDate: new Date("2026-01-06") },
      { name: "Empleado Demo 2", dailySalary: 200, startDate: new Date("2026-01-06") },
      { name: "Empleado Demo 3", dailySalary: 200, startDate: new Date("2026-01-06") },
    ],
  });

  // --- Rent ---
  await prisma.rent.create({
    data: {
      concept: "Renta local escolar",
      value: 2500,
      periodicity: Periodicity.SEMANAL,
      startDate: new Date("2026-01-06"),
      notes: "Valor DEMO configurable",
    },
  });

  // --- Expense category + expense ---
  const gastosFijos = await prisma.expenseCategory.create({ data: { name: "Gastos fijos" } });
  await prisma.expense.create({
    data: {
      concept: "Gasto mensual operativo",
      categoryId: gastosFijos.id,
      amount: 7000,
      date: new Date(),
      periodicity: Periodicity.MENSUAL,
    },
  });

  // --- Goals ---
  await prisma.goal.create({
    data: {
      name: "Meta mensual",
      type: Periodicity.MENSUAL,
      targetValue: 30000,
      startDate: new Date("2026-09-01"),
      endDate: new Date("2026-09-30"),
      currentValue: 20400,
    },
  });

  // --- Savings ---
  await prisma.savings.create({
    data: { label: "Ahorro acumulado DEMO", amount: 24500, date: new Date(), type: "MENSUAL" },
  });

  // --- Vacation period ---
  await prisma.vacationPeriod.create({
    data: {
      name: "Vacaciones SEP",
      startDate: new Date("2026-12-15"),
      endDate: new Date("2027-01-13"),
      days: 30,
      targetAmount: 40000,
      currentSavings: 24500,
    },
  });

  // --- Daily menu ---
  const menu = await prisma.dailyMenu.create({ data: { date: new Date(), active: true } });
  await prisma.dailyMenuItem.createMany({
    data: [
      { menuId: menu.id, label: "Tacos", emoji: "🌮", order: 0 },
      { menuId: menu.id, label: "Agua de jamaica", emoji: "🥤", order: 1 },
      { menuId: menu.id, label: "Fruta", emoji: "🍎", order: 2 },
    ],
  });

  // --- Carousel ---
  const carousel = await prisma.carousel.create({ data: { maxSlots: 5 } });
  await prisma.carouselImage.createMany({
    data: [1, 2, 3].map((n) => ({
      carouselId: carousel.id,
      imageUrl: `/demo/carousel-${n}.jpg`,
      title: `Promo demo ${n}`,
      order: n,
      displaySeconds: 5,
    })),
  });

  // --- Student + Order (ficticio) ---
  const student = await prisma.student.create({
    data: { name: "Alumno Demo", grade: "2º secundaria", group: "A" },
  });

  const order = await prisma.order.create({
    data: {
      studentId: student.id,
      total: 65,
      status: OrderStatus.RECIBIDO,
      items: {
        create: [
          { productId: products[0].id, quantity: 1, unitPrice: 30, subtotal: 30 },
          { productId: products[1].id, quantity: 1, unitPrice: 15, subtotal: 15 },
          { productId: products[2].id, quantity: 1, unitPrice: 20, subtotal: 20 },
        ],
      },
      statusHistory: { create: [{ status: OrderStatus.RECIBIDO }] },
    },
  });

  console.log("✅ Seed DEMO completado (SANDBOX). Usuarios demo (password: Demo1234!):");
  console.log("   -", admin.email, "(ADMINISTRADOR)");
  console.log("   - gestion@tenditalandy.demo (GESTION)");
  console.log("   - operador@tenditalandy.demo (OPERADOR)");
  console.log("   - padre@tenditalandy.demo (PADRE)");
  console.log("✅ Pedido demo creado:", order.number);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
