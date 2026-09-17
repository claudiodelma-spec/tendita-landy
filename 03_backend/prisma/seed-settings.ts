/**
 * Seed idempotente SOLO para la corrección "Dashboard financiero".
 * A diferencia de prisma/seed.ts (que falla si ya existen usuarios), este
 * script puede ejecutarse las veces que sea necesario sin duplicar nada —
 * pensado para actualizar una base de datos que ya fue sembrada antes de
 * que existieran estas Settings/modelos (por ejemplo, producción).
 */
import { prisma } from "../src/config/prisma.js";

async function main() {
  console.log("🔧 Agregando configuración de la corrección 'Dashboard financiero'...");

  const settings: { key: string; value: string; category: "FINANCE" }[] = [
    { key: "savings.mainGoal", value: "20000", category: "FINANCE" },
    { key: "savings.vacationFund", value: "10000", category: "FINANCE" },
    { key: "savings.targetStartDate", value: "2026-09-01", category: "FINANCE" },
    { key: "savings.targetEndDate", value: "2026-12-31", category: "FINANCE" },
    // NUEVO — Meta de ganancia (pedido posterior del usuario).
    { key: "finance.profitGoal", value: "15000", category: "FINANCE" },
    { key: "finance.profitGoalStartDate", value: "2026-09-01", category: "FINANCE" },
    { key: "finance.profitGoalEndDate", value: "2026-12-31", category: "FINANCE" },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {}, // no pisa un valor que el administrador ya haya configurado
      create: s,
    });
  }

  const today = new Date();
  const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  await prisma.income.upsert({
    where: { date: todayNormalized },
    update: {},
    create: { date: todayNormalized, amount: 2500, notes: "Demo" },
  });

  await prisma.dailyExpense.upsert({
    where: { date: todayNormalized },
    update: {},
    create: { date: todayNormalized, amount: 1000, notes: "Demo" },
  });

  const existingSavings = await prisma.savings.count();
  if (existingSavings === 0) {
    await prisma.savings.create({
      data: { label: "Ahorro real demo", amount: 1550, date: todayNormalized, type: "EXTRAORDINARIO" },
    });
  }

  console.log("✅ Configuración agregada (o ya existía — sin duplicados).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
