import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { CategoryPills } from "../components/CategoryPills";
import { ProductCard } from "../components/ProductCard";
import { storeService } from "../services/storeService";
import { useCart } from "../hooks/useCart";
import type { Category, Product } from "../types/store";

export function ProductsPage() {
  const { add } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    storeService.listActiveCategories().then(setCategories);
    storeService.listActiveProducts().then(setProducts);
  }, []);

  const visible = products.filter(
    (p) =>
      (!selectedCategory || p.categoryId === selectedCategory) &&
      p.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="px-5 pt-1">
        <p className="text-xl font-bold text-slate-900 mb-3">Productos</p>
        <div className="relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full bg-white border border-slate-200 rounded-full pl-10 pr-4 py-2.5 text-sm shadow-sm"
          />
        </div>
      </div>

      <CategoryPills categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} />

      <div className="grid grid-cols-2 gap-3 px-5">
        {visible.map((p) => (
          <ProductCard key={p.id} product={p} onAdd={add} />
        ))}
        {visible.length === 0 && (
          <p className="text-sm text-slate-400 col-span-2 text-center py-10">Sin resultados.</p>
        )}
      </div>
    </div>
  );
}

