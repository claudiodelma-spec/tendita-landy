import React, { useEffect, useState } from "react";
import { CarouselWidget } from "../components/CarouselWidget";
import { DailyMenuBanner } from "../components/DailyMenuBanner";
import { CategoryPills } from "../components/CategoryPills";
import { ProductCard } from "../components/ProductCard";
import { storeService } from "../services/storeService";
import { useCart } from "../hooks/useCart";
import { useAuth } from "../hooks/useAuth";
import type { Category, Product, DailyMenu, CarouselImage } from "../types/store";

// Section 22 — Home de la tienda: Logo (en TopBar) → Bienvenida → Carrusel →
// Menú del día → Categorías → Productos → Carrito (barra flotante).
export function HomePage() {
  const { user } = useAuth();
  const { add } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [menu, setMenu] = useState<DailyMenu | null>(null);
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    storeService.listActiveCategories().then(setCategories);
    storeService.listActiveProducts().then(setProducts);
    storeService.getTodayMenu().then(setMenu);
    storeService.getCarousel().then((c) => setImages(c?.images ?? []));
  }, []);

  const visibleProducts = selectedCategory
    ? products.filter((p) => p.categoryId === selectedCategory)
    : products;

  return (
    <div className="space-y-4">
      <div className="px-4">
        <p className="text-lg font-semibold text-slate-800">¡Hola{user?.name ? `, ${user.name}` : ""}! 👋</p>
        <p className="text-sm text-slate-400">¿Qué quieres pedir hoy?</p>
      </div>

      <CarouselWidget images={images} />
      <DailyMenuBanner menu={menu} />
      <CategoryPills categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} />

      <div className="grid grid-cols-2 gap-3 px-4">
        {visibleProducts.map((p) => (
          <ProductCard key={p.id} product={p} onAdd={add} />
        ))}
        {visibleProducts.length === 0 && (
          <p className="text-sm text-slate-400 col-span-2 text-center py-8">No hay productos disponibles ahora.</p>
        )}
      </div>
    </div>
  );
}
