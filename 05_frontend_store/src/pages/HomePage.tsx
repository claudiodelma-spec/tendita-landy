import React, { useEffect, useState } from "react";
import { CarouselWidget } from "../components/CarouselWidget";
import { DailyMenuBanner } from "../components/DailyMenuBanner";
import { CategoryPills } from "../components/CategoryPills";
import { ProductCard } from "../components/ProductCard";
import { storeService } from "../services/storeService";
import { useCart } from "../hooks/useCart";
import type { Category, Product, DailyMenu, CarouselImage } from "../types/store";

// Section 22 — Home: Logo (TopBar) → Bienvenida → Carrusel → Menú del día →
// Categorías → Productos → Carrito (barra flotante). Público, sin cuentas.
export function HomePage() {
  const { add } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [menu, setMenu] = useState<DailyMenu | null>(null);
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      storeService.listActiveCategories().then(setCategories),
      storeService.listActiveProducts().then(setProducts),
      storeService.getTodayMenu().then(setMenu),
      storeService.getCarousel().then((c) => setImages(c?.images ?? [])),
    ]).finally(() => setLoading(false));
  }, []);

  const visibleProducts = selectedCategory ? products.filter((p) => p.categoryId === selectedCategory) : products;

  if (loading) {
    return <p className="text-sm text-slate-400 text-center py-16">Cargando…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="px-5 pt-1">
        <p className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-orange-500">¡Hola! 👋</p>
        <p className="text-sm text-fuchsia-400 font-medium">¿Qué quieres pedir hoy?</p>
      </div>

      <CarouselWidget images={images} />
      <DailyMenuBanner menu={menu} />
      <CategoryPills categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} />

      <div className="grid grid-cols-2 gap-3 px-5">
        {visibleProducts.map((p) => (
          <ProductCard key={p.id} product={p} onAdd={add} />
        ))}
        {visibleProducts.length === 0 && (
          <p className="text-sm text-slate-400 col-span-2 text-center py-10">No hay productos disponibles ahora.</p>
        )}
      </div>
    </div>
  );
}
